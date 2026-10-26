//! A narrated explainer. Replace LINES and the beats in `film` with the script.
//! Every visual is timed from a spoken phrase, so re-voicing re-times the film.
//!
//!   explain-video.sh plan <film-dir>     time with macOS `say`, write <slug>.plan.json
//!   explain-video.sh voice <film-dir>    voice with ElevenLabs when ELEVENLABS_API_KEY is set
use std::{env, fs, path::PathBuf};

use anyhow::{Context, Result, bail};
use psychopomp::{
    author::{PlanBuilder, seconds},
    chrome,
    plan::ScenePlan,
    stage::{StageActor, StageElement, StagePlan, StagePost},
    subtitles::{SubtitlesActor, SubtitlesPlan},
    tone::Tone,
};
use psychopomp_media::{Audio, Media, Voice};

const TITLE: (&str, &str) = ("CONCEPT", "one line on what this film shows");

/// One narration line per beat: (id, text). Bracketed directions such as
/// "[curious]" steer ElevenLabs delivery and are dropped by macOS `say`.
const LINES: [(&str, &str); 3] = [
    ("hook", "[curious] Every request starts at the source."),
    ("mechanism", "The source sends a message down the link, and the sink receives it."),
    ("takeaway", "[warm] That round trip is the whole idea."),
];

fn main() -> Result<()> {
    let args: Vec<String> = env::args().skip(1).collect();
    let [film_dir, slug] = args.as_slice() else {
        bail!("usage: <scene> <film-dir> <slug>");
    };
    let root = PathBuf::from(film_dir);
    let media = Media::open(&root)?;
    let voice = narrator();
    let lines = LINES
        .iter()
        .map(|(id, text)| media.say(id, &voice, *text))
        .collect::<Result<Vec<Audio>>>()?;
    media.finish()?;

    let plan = film(&lines)?;
    let output = root.join(format!("{slug}.plan.json"));
    fs::write(&output, serde_json::to_string_pretty(&plan)? + "\n")?;
    eprintln!("wrote {} ({:.1}s)", output.display(), plan.duration_nanos as f64 / 1e9);
    Ok(())
}

/// The user's ElevenLabs narrator; ELEVENLABS_VOICE_ID overrides it for one film.
const VOICE_ID: &str = "0ggs85h7hrWz8ExXnsBc";

/// ElevenLabs when an API key is available, otherwise the free macOS voice.
fn narrator() -> Voice {
    if env::var("ELEVENLABS_API_KEY").map_or(true, |key| key.is_empty()) {
        return Voice::say("Samantha");
    }
    let id = env::var("ELEVENLABS_VOICE_ID").ok().filter(|id| !id.is_empty());
    Voice::eleven(id.as_deref().unwrap_or(VOICE_ID))
        .v4()
        .stability(0.4)
        .similarity(0.7)
        // 192 kbps needs the Creator tier; 128 kbps works on every plan.
        .format("mp3_44100_128")
}

fn stage() -> StagePlan {
    StagePlan {
        post: StagePost::RESTRAINED,
        elements: vec![
            StageElement::card("source", [560.0, 470.0, 0.0], [300.0, 110.0], "source").tone(Tone::Request),
            StageElement::card("sink", [1360.0, 470.0, 0.0], [300.0, 110.0], "sink").tone(Tone::Success),
            StageElement::beam("link", "source", "sink").tone(Tone::Request),
            StageElement::packet("message", "link").labeled("msg").tone(Tone::Request),
        ],
    }
}

fn film(lines: &[Audio]) -> Result<ScenePlan> {
    let (lead, gap, tail) = (seconds(1.2), seconds(0.6), seconds(1.5));
    let duration = lead + lines.iter().map(|l| l.duration() + gap).sum::<u64>() + tail;
    let mut scene = PlanBuilder::new("explainer", duration);

    let mut at = lead;
    let mut spoken = Vec::new();
    for line in lines {
        let said = line.place(&mut scene, at);
        at = said.end() + gap;
        spoken.push(said);
    }
    let [hook, mechanism, takeaway] = spoken.as_slice() else {
        bail!("expected one spoken line per beat");
    };

    let mut header = chrome::header(&mut scene, TITLE.0, TITLE.1)?;
    header.type_in(&mut scene, seconds(0.2), 55.0, 0.6);
    let mut stage = StageActor::declare(&mut scene, "stage", &stage())?;
    let (s, sc) = (&mut stage, &mut scene);

    // Beat 1: introduce the first entity on the word that names it.
    s.settle_in(sc, "source", hook.at("source"));

    // Beat 2: the mechanism, each motion on its word.
    s.settle_in(sc, "sink", mechanism.at("sink"));
    let wired = s.connect(sc, "link", mechanism.at("link"), 0.5);
    let arrived = s.send(sc, "message", wired.max(mechanism.at("sends")), 0.8);
    s.land(sc, "sink", arrived);

    // Beat 3: the takeaway lands on the whole picture.
    s.hit(sc, "source.glow", takeaway.at("whole idea"), 1.0, 0.0);
    s.hit(sc, "sink.glow", takeaway.at("whole idea"), 1.0, 0.0);

    for (k, said) in spoken.iter().enumerate() {
        SubtitlesActor::declare(
            &mut scene,
            &format!("subtitles-{k}"),
            &SubtitlesPlan::from_spoken(said, [960.0, 900.0], 1400.0).size(42.0),
        )?;
    }
    scene.finish().context("explainer")
}
