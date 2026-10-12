//! A learn-visually film. Replace the acts with the lesson's storyboard.
//! Every number shown comes from example/trace.json; film.rs maps simulated time
//! to film time and queues captions, chips, and rolling numbers in time order.
//!
//!   cargo +1.91 run --release --offline -- ../../example/trace.json ../<slug>.plan.json
use std::fs;

use anyhow::{Context, Result, bail};
use psychopomp::{
    author::{PlanBuilder, seconds},
    caption::CaptionAlign,
    chrome,
    rolling::{RollingNumberActor, RollingNumberPlan},
    stage::{StageActor, StageElement, StagePlan, StagePost},
    tone::Tone,
};
use serde_json::Value;

mod film;
use film::*;

const FLIGHT: f64 = 0.45;

fn main() -> Result<()> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let [trace_path, out_path] = args.as_slice() else {
        bail!("usage: <scene> <trace.json> <out.plan.json>");
    };
    let trace: Value = serde_json::from_str(&fs::read_to_string(trace_path).with_context(|| format!("read {trace_path}"))?)?;
    let (_, scenario) = trace["scenarios"].as_object().and_then(|s| s.iter().next()).context("trace has no scenarios")?;
    let steps = scenario["steps"].as_array().context("scenario has no steps")?;
    let times: Vec<f64> = steps.iter().map(|s| s["t_ms"].as_f64().unwrap_or(0.0)).collect();

    let mut elements = vec![
        StageElement::card("source", [560.0, 440.0, 0.0], [300.0, 110.0], "source").tone(Tone::Request),
        StageElement::card("sink", [1360.0, 440.0, 0.0], [300.0, 110.0], "sink").tone(Tone::Success),
        StageElement::beam("link", "source", "sink").tone(Tone::Request),
    ];
    for k in 1..=steps.len() {
        elements.push(StageElement::packet(&format!("msg-{k}"), "link").labeled(&format!("#{k}")).tone(Tone::Request));
    }
    let mut scene = PlanBuilder::new("film", seconds(600.0));
    let mut stage = StageActor::declare(&mut scene, "stage", &StagePlan { post: StagePost::RESTRAINED, elements })?;
    let mut clock_actor = RollingNumberActor::declare(
        &mut scene,
        "sim-clock",
        RollingNumberPlan::new([960.0, 236.0], 26.0, "0.0")
            .aligned(CaptionAlign::Center)
            .prefix(vec![span("simulated time  ", Tone::Muted)])
            .suffix(vec![span(" s", Tone::Muted)])
            .chip(),
    )?;
    let mut clock = Rolls::default();
    let mut footers = Footers::default();
    let mut chips = Chips::default();
    let mut beats = Beats::default();
    let sc = &mut scene;

    let mut header = chrome::header(sc, "CONCEPT", "one line on what this film shows")?;
    header.type_in(sc, seconds(0.3), 55.0, 0.6);
    let ready = stage.settle_in(sc, "source", seconds(0.4));
    stage.settle_in(sc, "sink", seconds(0.55));
    stage.connect(sc, "link", ready + seconds(0.2), 0.5);
    clock_actor.show_at(sc, 1.2);
    let t = footers.say(1.2, vec![span("the problem, in one line", Tone::Plain)]);

    // Slow time down 10x and pause before the second event for a prediction.
    let pause_at = times.get(1).copied().unwrap_or(times[0]);
    let film_clock = Clock { sim0: times[0], film0: t + 0.5, rates: vec![(times[0], 10.0)], pauses: vec![(pause_at, 6.0)] };
    chips.show(film_clock.post(times[0]), Tone::Muted, "10× slower");
    let q = film_clock.pre(pause_at);
    footers.say(q, vec![span("predict: ", Tone::Accent), span("what happens next?", Tone::Plain)]);
    countdown(sc, "predict-1", q + 0.3, 5.4)?;
    beats.mark("predict 1", q + 2.5);
    for (k, at_ms) in times.iter().enumerate() {
        let at = film_clock.post(*at_ms);
        stage.send(sc, &format!("msg-{}", k + 1), ns(at - FLIGHT), FLIGHT as f32);
        stage.land(sc, "sink", ns(at));
        clock.roll(at, secs(*at_ms, 1));
    }
    let end = film_clock.post(*times.last().unwrap_or(&0.0)) + 3.0;
    footers.say(end - 2.5, vec![span("the one-line takeaway", Tone::Plain)]);
    beats.mark("end", end - 0.5);

    clock.flush(&mut scene, &mut clock_actor)?;
    footers.flush(&mut scene)?;
    chips.flush(&mut scene)?;
    let mut plan = scene.finish().context("film")?;
    plan.duration_nanos = ns(end);
    fs::write(out_path, serde_json::to_string_pretty(&plan)?)?;
    fs::write(out_path.replace(".plan.json", ".beats.json"), serde_json::to_string_pretty(&beats.json())?)?;
    eprintln!("wrote {out_path}: {end:.1} s");
    Ok(())
}
