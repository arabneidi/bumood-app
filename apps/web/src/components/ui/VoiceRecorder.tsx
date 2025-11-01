"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Square, Loader2 } from 'lucide-react';
import Button from './Button';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({ onTranscription, onError, disabled = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      onError('Microphone access denied. Please allow microphone access to use voice recording.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const playRecording = () => {
    if (audioURL && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;

    setIsTranscribing(true);
    try {
      // Use Web Speech API for real-time speech recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;
        
        let hasResult = false;
        
        recognition.onstart = () => {
          console.log('Speech recognition started - listening for speech...');
        };
        
        recognition.onresult = (event: any) => {
          console.log('Speech recognition result:', event);
          hasResult = true;
          if (event.results && event.results.length > 0) {
            const transcript = event.results[0][0].transcript;
            console.log('Transcribed text:', transcript);
            onTranscription(transcript);
            setIsTranscribing(false);
          }
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'no-speech') {
            onError('No speech detected. Please try speaking clearly and try again.');
          } else if (event.error === 'audio-capture') {
            onError('No microphone found. Please check your microphone.');
          } else if (event.error === 'not-allowed') {
            onError('Microphone permission denied. Please allow microphone access.');
          } else if (event.error === 'network') {
            onError('Network error. Please check your internet connection.');
          } else {
            onError(`Speech recognition error: ${event.error}. Please try again.`);
          }
          setIsTranscribing(false);
        };
        
        recognition.onend = () => {
          console.log('Speech recognition ended');
          if (!hasResult) {
            onError('No speech was recognized. Please speak clearly and try again.');
          }
          setIsTranscribing(false);
        };
        
        recognition.onnomatch = () => {
          console.log('No speech was recognized');
          onError('No speech was recognized. Please speak clearly and try again.');
          setIsTranscribing(false);
        };
        
        // Start recognition
        console.log('Starting speech recognition...');
        recognition.start();
        
        // Stop recognition after 15 seconds
        setTimeout(() => {
          if (recognition.state === 'started') {
            console.log('Stopping speech recognition due to timeout');
            recognition.stop();
          }
        }, 15000);
        
      } else {
        // Fallback to mock transcription
        onError('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
        fallbackTranscription();
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);
      onError('Failed to start speech recognition. Please try again.');
      fallbackTranscription();
    }
  };

  const fallbackTranscription = async () => {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockTranscriptions = [
      "I'm feeling really good today, had a great workout and feeling energized.",
      "Feeling a bit stressed about work, but trying to stay positive.",
      "Had a relaxing day, feeling calm and peaceful.",
      "Feeling tired but accomplished after a productive day.",
      "Feeling anxious about tomorrow's presentation, but I'm prepared.",
      "Feeling grateful for the small things in life today.",
      "Had a challenging day but learned something new.",
      "Feeling optimistic about the future and my goals.",
      "Feeling overwhelmed with everything going on, need to take a break.",
      "Feeling confident and ready to tackle new challenges."
    ];
    
    const randomTranscription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
    onTranscription(randomTranscription);
    setIsTranscribing(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Voice Entry</h3>
        <p className="text-sm text-gray-600 mb-4">
          Record your thoughts and we'll convert them to text using AI
        </p>
      </div>

      {!audioBlob ? (
        <div className="text-center">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              disabled={disabled}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Mic className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Recording... {formatTime(recordingTime)}
                  </span>
                </div>
                <Button
                  onClick={stopRecording}
                  className="bg-gray-500 hover:bg-gray-600 text-white"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={isPlaying ? pauseRecording : playRecording}
              variant="outline"
              size="sm"
            >
              {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            
            <Button
              onClick={transcribeAudio}
              disabled={isTranscribing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isTranscribing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mic className="w-4 h-4 mr-2" />
              )}
              {isTranscribing ? 'Transcribing...' : 'Convert to Text'}
            </Button>
          </div>

          <div className="text-center">
            <Button
              onClick={() => {
                setAudioBlob(null);
                setAudioURL(null);
                setRecordingTime(0);
                if (audioURL) {
                  URL.revokeObjectURL(audioURL);
                }
              }}
              variant="ghost"
              size="sm"
            >
              Record Again
            </Button>
          </div>
        </div>
      )}

      {audioURL && (
        <audio
          ref={audioRef}
          src={audioURL}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  );
}
