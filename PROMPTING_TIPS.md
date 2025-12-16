# Prompting Tips

Get the most out of AI MIDI Composer with these prompting strategies.

## Basic Structure

The AI responds best to prompts that include:

1. **Genre or style** - What kind of music?
2. **Mood or emotion** - How should it feel?
3. **Tempo hint** - Fast, slow, moderate?
4. **Length** - Short phrase, full progression, extended piece?

## Genre & Style

Be specific about the musical style you want:

```
"A jazz piano ballad with complex chord voicings"
"An 80s synthwave arpeggio pattern"
"A Bach-style fugue motif"
"Lo-fi hip hop chord progression"
"Metal power chord riff in drop D tuning"
"Ambient pad with slow evolving textures"
```

## Mood & Emotion

Describe the feeling you're going for:

```
"melancholic and introspective"
"uplifting and triumphant"
"dark and tense"
"playful and bouncy"
"peaceful and meditative"
"energetic and driving"
```

## Tempo Hints

While the AI chooses the BPM, you can guide it:

```
"slow ballad tempo" → ~60-80 BPM
"moderate groove" → ~90-110 BPM
"upbeat dance track" → ~120-130 BPM
"fast punk energy" → ~160-180 BPM
```

Or be explicit: `"...at around 140 BPM"`

## Length & Duration

Specify how long you want the composition:

```
"a short 4-bar phrase"
"an 8-bar loop"
"a 16-bar verse section"
"a 32-bar full progression"
```

## Register & Range

Guide where notes should sit:

```
"high register melody"
"deep bass notes"
"mid-range chords"
"wide range spanning multiple octaves"
```

## Rhythm & Feel

Describe the rhythmic character:

```
"syncopated rhythms"
"straight eighth notes"
"dotted rhythms"
"swing feel"
"driving quarter notes"
"complex polyrhythmic patterns"
```

## Adding Parts Effectively

When using the Melody, Chords, or Bass buttons to layer parts:

- **Melody** works best when your base has clear harmonic structure
- **Chords** fills out sparse melodic lines nicely
- **Bass** anchors everything with a rhythmic foundation

**Tip:** Start with chords or a simple melody, then layer the other parts.

## Example Prompts

### Simple & Effective
```
"Happy major key melody, 8 bars"
"Sad piano ballad in A minor"
"Funky bass groove, 4 bars at 100 BPM"
```

### Detailed & Specific
```
"A melancholic jazz piano piece in D minor with walking bass
notes and sparse, emotional melody. 16 bars at a slow
70 BPM tempo."
```

```
"An energetic chiptune arpeggio pattern reminiscent of
classic NES games. Fast tempo, major key, 8 bars with
rapid sixteenth note runs."
```

```
"A cinematic orchestral motif building from soft strings
to a powerful brass climax. Epic and triumphant mood,
moderate tempo around 90 BPM."
```

### Creative & Experimental
```
"Atonal piano clusters with random velocity accents"
"Minimalist repeating pattern that slowly evolves"
"Polymetric rhythm with 7/8 against 4/4 feel"
```

## What to Avoid

- **Too vague:** "Make something cool" - gives the AI no direction
- **Too technical:** "MIDI CC 64 pedal with aftertouch modulation" - the output is notes only
- **Contradictory:** "Fast slow ballad" - confuses the AI
- **Non-musical requests:** "Write lyrics about summer" - this tool generates notes, not text

## Tips for Best Results

1. **Iterate** - If the first result isn't perfect, try rephrasing
2. **Layer gradually** - Add one part at a time to hear how it fits
3. **Be specific about length** - The AI defaults to short phrases without guidance
4. **Name the key** - "in C major" or "in F# minor" helps with consistency
5. **Reference artists/songs** - "in the style of Debussy" or "like a Beatles chord progression"

## Model Selection

Different AI models have different strengths:

- **Larger models** (GPT-5, Claude) tend to produce more musical and coherent output
- **Faster models** (Grok Fast, Haiku) are quicker but may be less nuanced
- **Free models** may have rate limits or less consistent quality

Experiment to find what works best for your use case.
