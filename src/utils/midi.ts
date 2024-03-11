import React from 'react'
import { useInterval } from 'react-use'

const NOTE_TO_MIDI_CODE = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  'E#': 5,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
  Cb: 11,
  'B#': 0,
}

type Note = keyof typeof NOTE_TO_MIDI_CODE

interface MidiCcProps {
  code: number
  value?: number
  channel?: number
}

/**
 * Send a MIDI CC (continuous controller) message.
 * Sends to the given channel if specified, otherwise sends to all channels.
 */
const midiCc = (
  midi: MIDIAccess,
  { code, value = 127, channel }: MidiCcProps
): void => {
  if (channel !== undefined) {
    return sendBytes(midi, [0xb0 + channel, code, value])
  }
  for (let channel = 0; channel < 16; channel++) {
    sendBytes(midi, [0xb0 + channel, code, value])
  }
}

interface MidiNoteOnProps {
  note: Note
  oct?: number
  vol?: number
  channel?: number
}

/**
 * Send a MIDI note on message.
 * * Sends to the given channel if specified, otherwise sends to all channels.
 */
const midiNoteOn = (
  midi: MIDIAccess,
  { note, oct = 4, vol = 1, channel }: MidiNoteOnProps
): void => {
  const midiNote = getMidiNote(note, oct)
  const velocity = Math.floor(vol * 127)
  if (channel !== undefined) {
    return sendBytes(midi, [0x90 + channel, midiNote, velocity])
  }
  for (let channel = 0; channel < 16; channel++) {
    sendBytes(midi, [0x90 + channel, midiNote, velocity])
  }
}

interface MidiNoteOffProps {
  note: Note
  oct?: number
  channel?: number
}

/**
 * Send a MIDI note off message.
 * * Sends to the given channel if specified, otherwise sends to all channels.
 */
const midiNoteOff = (
  midi: MIDIAccess,
  { note, oct = 4, channel }: MidiNoteOffProps
): void => {
  const midiNote = getMidiNote(note, oct)
  if (channel !== undefined) {
    return sendBytes(midi, [0x90 + channel, midiNote])
  }
  for (let channel = 0; channel < 16; channel++) {
    sendBytes(midi, [0x90 + channel, midiNote])
  }
}

type UseMidi = (args?: { defaultChannel?: number }) => {
  midiError: string
  isMidiLoading: boolean
  midiCc: (args: MidiCcProps) => void
  midiNoteOn: (args: MidiNoteOnProps) => void
  midiNoteOff: (args: MidiNoteOffProps) => void
}

/**
 * React hook to send MIDI commands to all outputs.
 */
export const useMidi: UseMidi = ({ defaultChannel } = {}) => {
  const [midi, setMidi] = React.useState<MIDIAccess | null>(null)
  const [midiError, setMidiError] = React.useState('')
  const [isMidiLoading, setIsMidiLoading] = React.useState(true)

  // Ensure we have access to the MIDI API
  React.useEffect(() => {
    if (!midi) {
      navigator
        .requestMIDIAccess({ sysex: true, software: true })
        .then(setMidi, setMidiError)
        .catch(setMidiError)
    } else {
      setIsMidiLoading(false)
    }
  }, [])

  // Poll for MIDI access permission
  useInterval(
    () => {
      navigator.permissions
        // @ts-ignore
        .query({ name: 'midi', sysex: true })
        .then((result) => {
          if (result.state === 'granted') {
            console.debug('MIDI access granted')
          } else if (result.state === 'prompt') {
            console.debug('MIDI access pending')
          } else {
            console.error('MIDI access denied')
            setMidiError('MIDI access denied')
          }
        })
    },
    midi ? null : 1000
  )

  // Return loading state if MIDI is not available
  if (!midi) {
    return {
      midiError,
      isMidiLoading,
      midiCc: () => {},
      midiNoteOn: () => {},
      midiNoteOff: () => {},
    }
  }

  return {
    midiError,
    isMidiLoading,
    midiCc: ({ code, value, channel = defaultChannel }: MidiCcProps) =>
      midiCc(midi, { code, value, channel }),
    midiNoteOn: ({
      note,
      oct,
      vol,
      channel = defaultChannel,
    }: MidiNoteOnProps) => midiNoteOn(midi, { note, oct, vol, channel }),
    midiNoteOff: ({ note, oct, channel = defaultChannel }: MidiNoteOffProps) =>
      midiNoteOff(midi, { note, oct, channel }),
  }
}

export default { useMidi }

/**
 * Send a byte array to all MIDI outputs.
 */
const sendBytes = (midi: MIDIAccess, bytes: number[]): void => {
  for (let output of midi.outputs.values()) {
    output.send(new Uint8Array(bytes))
  }
}

const getMidiNote = (note: Note, octave: number): number => {
  const noteNumber = NOTE_TO_MIDI_CODE[note]
  const octaveOffset = (octave + 1) * 12
  return noteNumber + octaveOffset
}
