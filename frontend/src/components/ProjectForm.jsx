import React, { useState, useRef, useEffect } from 'react';
import { createProject, generateProject, transcribeAudio } from '../api/client';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

/**
 * ProjectForm Component
 * Renders the form to enter a project name and description,
 * validates inputs, handles submissions, and coordinates the AI PRD generation.
 * Also handles real-time Web Speech transcription and post-recording Groq Whisper polish.
 * 
 * Props:
 * @param {string} token - The authenticated user's JWT token.
 * @param {function} onGenerationSuccess - Callback called when a project and its PRD are successfully generated.
 *                                         Receives the full project object including generated documents.
 */
const ProjectForm = ({ token, onGenerationSuccess }) => {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [descError, setDescError] = useState(false);

  // Speech-to-text state variables
  const [transcribeState, setTranscribeState] = useState('default'); // 'default' | 'recording' | 'processing'
  const [statusPill, setStatusPill] = useState(null); // 'listening' | 'polishing' | null
  const [inlineMsg, setInlineMsg] = useState(null); // error or warning text
  const [showToast, setShowToast] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasShownTooltip, setHasShownTooltip] = useState(false);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const voiceSessionBaseRef = useRef('');
  const finalTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');

  // Speech Recognition support check
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const isSpeechSupported = !!SpeechRecognition;

  useEffect(() => {
    return () => {
      // Release tracks on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const handleMouseEnterTextarea = () => {
    if (!isSpeechSupported && !hasShownTooltip) {
      setShowTooltip(true);
    }
  };

  const handleMouseLeaveTextarea = () => {
    if (showTooltip) {
      setShowTooltip(false);
      setHasShownTooltip(true); // show tooltip only once on hover
    }
  };

  const handleMicClick = async () => {
    if (transcribeState === 'recording') {
      // Phase 2: Stop recording
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn("Failed to stop speech recognition:", e);
        }
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.warn("Failed to stop MediaRecorder:", e);
        }
      }
      return;
    }

    if (transcribeState === 'processing') return;

    // Phase 1: Start recording
    setInlineMsg(null);
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    voiceSessionBaseRef.current = projectDescription;

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;
    } catch (err) {
      setInlineMsg("Microphone access denied. Please allow access in your browser settings.");
      setTimeout(() => {
        setInlineMsg(prev => prev === "Microphone access denied. Please allow access in your browser settings." ? null : prev);
      }, 5000);
      return;
    }

    // Initialize Web Speech API
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.stream = stream; // Pass same stream object
    recognitionRef.current = recognition;

    // Initialize MediaRecorder
    const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg']
      .find(type => MediaRecorder.isTypeSupported(type)) || '';

    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mediaRecorder;
    const chunks = [];
    
    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      setTranscribeState('processing');
      setStatusPill('polishing');

      const audioBlob = new Blob(chunks, { type: mimeType });
      const webSpeechAdded = finalTranscriptRef.current + interimTranscriptRef.current;
      const voiceAddedTextLength = webSpeechAdded.trim().length;

      try {
        const result = await transcribeAudio(token, audioBlob);
        const groqResult = result && result.text ? result.text : '';

        if (voiceAddedTextLength === 0 && groqResult.trim().length === 0) {
          setInlineMsg("No speech detected. Please try again.");
          setTimeout(() => {
            setInlineMsg(prev => prev === "No speech detected. Please try again." ? null : prev);
          }, 3000);
          setProjectDescription(voiceSessionBaseRef.current);
        } else {
          // Replace ONLY the voice-added portion of the textarea
          setProjectDescription(voiceSessionBaseRef.current + groqResult);
          
          setShowToast(true);
          setTimeout(() => {
            setShowToast(false);
          }, 2000);
        }
      } catch (err) {
        // Groq failed -> Keep Web Speech API text already in the textarea
        setInlineMsg("Could not polish transcript — speech-to-text result kept.");
        setTimeout(() => {
          setInlineMsg(prev => prev === "Could not polish transcript — speech-to-text result kept." ? null : prev);
        }, 4000);
      } finally {
        setTranscribeState('default');
        setStatusPill(null);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      }
    };

    recognition.onresult = event => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      finalTranscriptRef.current = finalTranscript;
      interimTranscriptRef.current = interimTranscript;
      
      // Update the textarea value in real time
      setProjectDescription(voiceSessionBaseRef.current + finalTranscript + interimTranscript);
      setDescError(false);
      setValidationError('');
    };

    recognition.onerror = e => {
      console.error("Speech recognition error:", e);
      if (e.error === 'not-allowed') {
        setInlineMsg("Microphone access denied. Please allow access in your browser settings.");
        setTimeout(() => {
          setInlineMsg(prev => prev === "Microphone access denied. Please allow access in your browser settings." ? null : prev);
        }, 5000);
        cleanupRecordingState();
      }
    };

    const cleanupRecordingState = () => {
      setTranscribeState('default');
      setStatusPill(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }
    };

    // Start both concurrently
    try {
      recognition.start();
      mediaRecorder.start(250);
      setTranscribeState('recording');
      setStatusPill('listening');
    } catch (e) {
      console.error("Failed to start speech recording:", e);
      setInlineMsg("Failed to start speech recording. Please try again.");
      setTimeout(() => {
        setInlineMsg(prev => prev === "Failed to start speech recording. Please try again." ? null : prev);
      }, 3000);
      cleanupRecordingState();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset previous errors
    setError('');
    setValidationError('');
    setDescError(false);

    // Pre-submit validation
    if (!projectDescription.trim()) {
      setDescError(true);
      return;
    }

    if (!projectName.trim()) {
      setValidationError('Project Name is required.');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create the project record
      const createdProject = await createProject(token, projectName, projectDescription);
      
      // Step 2: Trigger AI generation for this project
      const generateResponse = await generateProject(token, createdProject.id);

      // On success, notify parent component and clear fields
      onGenerationSuccess(createdProject.id, projectName, projectDescription, generateResponse.sections);
      setProjectName('');
      setProjectDescription('');
    } catch (err) {
      // Preserve entered values when generation fails (do not reset state fields)
      setError(err.message || 'PRD generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check form completeness for AI generation button
  const isFormInvalid = !projectName.trim();

  return (
    <div className="project-form-container">
      <h2 className="form-title">Create a New PRD</h2>
      
      {error && <ErrorMessage message={error} />}
      
      <form onSubmit={handleSubmit} className="project-form">
        <div className="form-group">
          <label htmlFor="projectName" className="form-label">Project Name</label>
          <input
            id="projectName"
            name="project_name"
            type="text"
            className="form-input"
            placeholder="e.g. Movie Streaming App"
            value={projectName}
            disabled={loading}
            onChange={(e) => {
              setProjectName(e.target.value);
              if (e.target.value.trim()) setValidationError('');
            }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="projectDescription" className="form-label">Project Description</label>
          <div 
            className="textarea-wrapper" 
            style={{ position: 'relative' }}
            onMouseEnter={handleMouseEnterTextarea}
            onMouseLeave={handleMouseLeaveTextarea}
          >
            <textarea
              id="projectDescription"
              name="project_description"
              className={`form-textarea ${descError ? 'input-error' : ''}`}
              placeholder="Describe your app's core features, target users, and goals..."
              value={projectDescription}
              disabled={loading}
              onChange={(e) => {
                setProjectDescription(e.target.value);
                if (e.target.value.trim()) {
                  setDescError(false);
                  setValidationError('');
                }
              }}
              rows={5}
              style={{ paddingBottom: isSpeechSupported ? '44px' : undefined }}
            />
            {isSpeechSupported ? (
              <button
                type="button"
                className={`mic-button ${transcribeState} ${loading ? 'disabled' : ''}`}
                onClick={handleMicClick}
                disabled={loading || transcribeState === 'processing'}
                title={transcribeState === 'recording' ? 'Stop listening' : 'Start voice input'}
              >
                {transcribeState === 'processing' ? (
                  <svg className="spinner-icon-mini" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255, 255, 255, 0.2)"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeDasharray="30 150"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                )}
              </button>
            ) : (
              showTooltip && (
                <div className="unsupported-tooltip">
                  Voice input requires Chrome or Edge
                </div>
              )
            )}
          </div>
          
          {statusPill === 'listening' && (
            <div className="transcription-pill listening">
              <span className="red-dot"></span>
              Listening... click mic to stop
            </div>
          )}
          {statusPill === 'polishing' && (
            <div className="transcription-pill polishing">
              <span className="spinner-mini"></span>
              Polishing transcript...
            </div>
          )}
          
          {inlineMsg && (
            <p className="transcription-error-message" role="alert">
              {inlineMsg}
            </p>
          )}

          {descError && (
            <p className="validation-error-message" role="alert" style={{ color: 'var(--error)', marginTop: '4px', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
              ❌ Project description is required.
            </p>
          )}
        </div>

        {/* Display inline validation warning if user interacts and fields are missing */}
        {validationError && (
          <p className="validation-error-message" role="alert">
            {validationError}
          </p>
        )}

        {isFormInvalid && !validationError && (
          <p className="form-hint-message">
            Fill out both fields to enable AI PRD generation.
          </p>
        )}

        <button
          type="submit"
          className="btn-primary generate-button"
          disabled={isFormInvalid || loading}
        >
          {loading ? 'Generating...' : 'Generate Plan'}
        </button>
      </form>

      {loading && <LoadingSpinner />}

      {showToast && (
        <div className="success-toast">
          Transcript ready
        </div>
      )}
    </div>
  );
};

export default ProjectForm;
