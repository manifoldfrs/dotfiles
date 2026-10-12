//! Reusable film machinery for learn-visually animations on Psychopomp.
//! Copied from the learn-visually skill's templates/scene/film.rs; edit freely.
#![allow(dead_code)]
use anyhow::Result;
use psychopomp::{
    author::{PlanBuilder, seconds},
    caption::CaptionSpanPlan,
    chrome,
    meter::{MeterActor, MeterPlan},
    rolling::RollingNumberActor,
    tone::Tone,
};
use serde_json::Value;

/// Maps simulated milliseconds to film seconds: piecewise slow-motion factors
/// plus pauses inserted before a simulated instant. During a pause simulated
/// time stands still, so nothing refills.
pub struct Clock {
    pub sim0: f64,
    pub film0: f64,
    /// (from simulated ms, film seconds per simulated second)
    pub rates: Vec<(f64, f64)>,
    /// (at simulated ms, film seconds)
    pub pauses: Vec<(f64, f64)>,
}

impl Clock {
    pub fn running(&self, sim: f64) -> f64 {
        let mut film = self.film0;
        for (k, &(from, rate)) in self.rates.iter().enumerate() {
            let to = self.rates.get(k + 1).map_or(f64::INFINITY, |r| r.0);
            let a = from.max(self.sim0);
            let b = to.min(sim);
            if b > a {
                film += (b - a) / 1000.0 * rate;
            }
        }
        film
    }
    /// Film time just before any pause at `sim`.
    pub fn pre(&self, sim: f64) -> f64 {
        self.running(sim) + self.pauses.iter().filter(|p| p.0 < sim).map(|p| p.1).sum::<f64>()
    }
    /// Film time just after any pause at `sim`: when events at `sim` happen.
    pub fn post(&self, sim: f64) -> f64 {
        self.running(sim) + self.pauses.iter().filter(|p| p.0 <= sim).map(|p| p.1).sum::<f64>()
    }
}

pub fn ns(film_seconds: f64) -> u64 {
    seconds(film_seconds.max(0.0))
}

pub fn span(text: &str, tone: Tone) -> CaptionSpanPlan {
    CaptionSpanPlan::new(text, tone)
}

pub fn fmt(x: f64) -> String {
    let rounded = (x * 100.0).round() / 100.0;
    if rounded.fract() == 0.0 { format!("{rounded:.0}") } else { format!("{rounded}") }
}

pub fn secs(ms: f64, decimals: usize) -> String {
    format!("{:.*}", decimals, ms / 1000.0)
}

/// Words on screen need at least 0.3 s each, and never less than 1.5 s.
pub fn reading_seconds(text: &str) -> f64 {
    (text.split_whitespace().count() as f64 * 0.3).max(1.5)
}

/// Footer captions and status chips are scheduled out of order by the acts, so
/// they are queued and flushed in time order: each one hides when the next appears.
#[derive(Default)]
pub struct Footers(Vec<(f64, Option<Vec<CaptionSpanPlan>>)>);

impl Footers {
    /// Queue a footer typed in at `at`; returns when it has been on screen long enough to read.
    pub fn say(&mut self, at: f64, spans: Vec<CaptionSpanPlan>) -> f64 {
        let text: String = spans.iter().map(|s| s.text.as_str()).collect();
        let typing = text.chars().count() as f64 / 48.0;
        self.0.push((at, Some(spans)));
        // The next caption starts after this one has fully faded out (see flush).
        at + typing + reading_seconds(&text) + CAPTION_GAP + 0.15
    }
    pub fn clear(&mut self, at: f64) {
        self.0.push((at, None));
    }
    pub fn flush(mut self, scene: &mut PlanBuilder) -> Result<()> {
        self.0.sort_by(|a, b| a.0.total_cmp(&b.0));
        let times: Vec<f64> = self.0.iter().map(|(at, _)| *at).collect();
        for (k, (at, spans)) in self.0.into_iter().enumerate() {
            let Some(spans) = spans else { continue };
            let mut caption = chrome::footer(scene, &format!("footer-{k}"), spans)?;
            caption.type_in(scene, ns(at), 48.0, 0.6);
            if let Some(next) = times.get(k + 1) {
                caption.hide(scene, ns(next - CAPTION_GAP));
            }
        }
        Ok(())
    }
}

/// Seconds between one caption starting to fade and the next typing in, so two
/// captions never share the footer line.
pub const CAPTION_GAP: f64 = 0.35;

#[derive(Default)]
pub struct Chips(Vec<(f64, Tone, String)>);

impl Chips {
    pub fn show(&mut self, at: f64, dot: Tone, text: &str) {
        self.0.push((at, dot, text.to_owned()));
    }
    pub fn flush(mut self, scene: &mut PlanBuilder) -> Result<()> {
        self.0.sort_by(|a, b| a.0.total_cmp(&b.0));
        let times: Vec<f64> = self.0.iter().map(|c| c.0).collect();
        for (k, (at, dot, text)) in self.0.into_iter().enumerate() {
            let mut chip = chrome::chip(scene, &format!("chip-{k}"), dot, &text)?;
            chip.show(scene, ns(at + 0.15));
            if let Some(next) = times.get(k + 1) {
                chip.hide(scene, ns(*next));
            }
        }
        Ok(())
    }
}

/// Rolling numbers need their changes in strictly increasing time order, but the
/// acts schedule them out of order (a pause is computed after its later steps).
#[derive(Default)]
pub struct Rolls(Vec<(f64, String)>);

impl Rolls {
    pub fn roll(&mut self, at: f64, value: impl Into<String>) {
        self.0.push((at, value.into()));
    }
    pub fn flush(mut self, scene: &mut PlanBuilder, actor: &mut RollingNumberActor) -> Result<()> {
        self.0.sort_by(|a, b| a.0.total_cmp(&b.0));
        let mut last = f64::NEG_INFINITY;
        for (at, value) in self.0 {
            let at = if at <= last { last + 0.001 } else { at };
            actor.roll(scene, ns(at), value)?;
            last = at;
        }
        Ok(())
    }
}

/// A prediction pause: a ring that sweeps closed while the viewer commits to an answer.
pub fn countdown(scene: &mut PlanBuilder, id: &str, at: f64, length: f64) -> Result<()> {

    let plan = MeterPlan::countdown([1640.0, 770.0], 62.0, length as f32).label("predict");
    let mut timer = MeterActor::declare(scene, id, &plan, length as f32)?;
    timer.show(scene, ns(at));
    let end = timer.countdown(scene, ns(at + 0.3), (length - 0.3) as f32);
    timer.hide(scene, end + seconds(0.2));
    Ok(())
}

/// Named film times for review: written beside the plan as <slug>.beats.json.
#[derive(Default)]
pub struct Beats(pub Vec<(String, f64)>);

impl Beats {
    pub fn mark(&mut self, name: &str, at: f64) {
        self.0.push((name.to_owned(), at));
    }
    pub fn json(&self) -> Value {
        Value::Array(self.0.iter().map(|(name, at)| serde_json::json!({ "beat": name, "seconds": (at * 100.0).round() / 100.0 })).collect())
    }
}

pub trait ShowAt {
    fn show_at(&mut self, scene: &mut PlanBuilder, at: f64);
    fn hide_at(&mut self, scene: &mut PlanBuilder, at: f64);
}

impl ShowAt for RollingNumberActor {
    fn show_at(&mut self, scene: &mut PlanBuilder, at: f64) {
        let opacity = self.channel(scene, "opacity", 0.0);
        scene.spring(&opacity, ns(at), 1.0, 0.45, 0.0);
    }
    fn hide_at(&mut self, scene: &mut PlanBuilder, at: f64) {
        let opacity = self.channel(scene, "opacity", 0.0);
        scene.spring(&opacity, ns(at), 0.0, 0.24, 0.0);
    }
}
