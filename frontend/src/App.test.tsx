// src/App.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock must be declared before importing App
vi.mock('@ai-sdk/react', async () => {
  const actual = await vi.importActual<typeof import('@ai-sdk/react')>('@ai-sdk/react');
  return {
    ...actual,
    useChat: vi.fn(),
  };
});

import { useChat } from '@ai-sdk/react';
import App from './App';

const mockUseChat = useChat as ReturnType<typeof vi.fn>;

const setupUseChat = (overrides?: Record<string, unknown>) => {
  const sendMessage = vi.fn();
  const stop = vi.fn();
  const regenerate = vi.fn();

  mockUseChat.mockReturnValue({
    messages: [],
    sendMessage,
    status: 'ready',
    stop,
    error: null,
    regenerate,
    ...overrides,
  });

  return { sendMessage, stop, regenerate };
};

describe('<App />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header and empty state', () => {
    setupUseChat();

    render(<App />);

    expect(screen.getByText(/ai job coach/i)).toBeInTheDocument();
    expect(
      screen.getByText(/upload your cv, then ask for a jd match/i)
    ).toBeInTheDocument();
  });

  it('shows warning and does not send message when CV has not been uploaded', async () => {
    const { sendMessage } = setupUseChat();

    render(<App />);

    const textarea = screen.getByPlaceholderText(
      /paste the job description or ask/i
    );
    const form = textarea.closest('form') as HTMLFormElement;

    await fireEvent.change(textarea, {
      target: { value: 'How strong is my CV for this job?' },
    });

    await fireEvent.submit(form);

    expect(sendMessage).not.toHaveBeenCalled();
    expect(
      screen.getByText(/upload your cv first so the analyser can use it\./i)
    ).toBeInTheDocument();
  });

  it('sends message with userId after CV upload success', async () => {
    const { sendMessage } = setupUseChat();

    render(<App />);

    const cvTextarea = screen.getByPlaceholderText(/paste your cv here/i);
    const uploadButton = screen.getByRole('button', { name: /upload cv/i });

    await fireEvent.change(cvTextarea, {
      target: { value: 'My CV content' },
    });

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, chunkCount: 2 }),
    } as Response);

    await fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    const chatTextarea = screen.getByPlaceholderText(
      /paste the job description or ask/i
    );
    const chatForm = chatTextarea.closest('form') as HTMLFormElement;

    await fireEvent.change(chatTextarea, {
      target: { value: 'How strong is my CV for this job?' },
    });

    await fireEvent.submit(chatForm);

    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledTimes(1);
    });

    const [messageArg, optionsArg] = sendMessage.mock.calls[0];

    expect(messageArg).toEqual({ text: 'How strong is my CV for this job?' });
    expect(optionsArg).toEqual(
      expect.objectContaining({
        body: { userId: 'default-user' },
      })
    );
  });

  it('shows error banner and calls regenerate on retry', async () => {
    const { regenerate } = setupUseChat({
      error: new Error('Something went wrong'),
    });

    render(<App />);

    expect(
      screen.getByText(/something went wrong\. check the mastra server is running\./i)
    ).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /retry/i });
    await fireEvent.click(retryButton);

    expect(regenerate).toHaveBeenCalledTimes(1);
  });

  it('renders assistant text, analysis result view, and generic tool card from message parts', async () => {
    setupUseChat({
      messages: [
        {
          id: 'assistant-1',
          role: 'assistant',
          parts: [
            {
              type: 'text',
              text: 'Here is your CV analysis.',
            },
            {
              type: 'tool-jdScorerTool',
              toolName: 'jdScorerTool',
              state: 'output-available',
              input: {
                jobDescription: 'Senior frontend engineer role',
              },
              output: {
                score: 82,
                matchingSkills: ['React', 'TypeScript'],
                missingSkills: ['D3'],
                summary: 'Strong frontend alignment with one notable gap.',
                rewriteBlock: {
                  withEvidence: [],
                  noEvidence: [],
                },
              },
            },
            {
              type: 'tool-cvRetrieverTool',
              toolName: 'cvRetrieverTool',
              state: 'output-available',
              input: {
                query: 'React',
              },
              output: {
                documents: ['Built React apps'],
              },
            },
          ],
        },
      ],
    });

    render(<App />);

    // Assistant text part
    expect(screen.getByText(/here is your cv analysis\./i)).toBeInTheDocument();

    // CvAnalysisResultView path
    expect(screen.getByText(/match summary/i)).toBeInTheDocument();
    expect(screen.getByText('82%')).toBeInTheDocument();
    expect(
      screen.getByText(/strong frontend alignment with one notable gap\./i)
    ).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('D3')).toBeInTheDocument();

    // Generic ToolCard path
    expect(screen.getByText(/🔧 cvretrievertool/i)).toBeInTheDocument();

    const showButtons = screen.getAllByRole('button', { name: /show/i });
    const retrieverButton = showButtons.find(button =>
      button.textContent?.toLowerCase().includes('cvretrievertool')
    );

    expect(retrieverButton).toBeTruthy();
    await fireEvent.click(retrieverButton!);

    expect(screen.getByText(/^input$/i)).toBeInTheDocument();
    expect(screen.getByText(/^output$/i)).toBeInTheDocument();

    // Specific checks for ToolCard content
    expect(screen.getByText(/"query": "react"/i)).toBeInTheDocument();
    expect(screen.getByText(/built react apps/i)).toBeInTheDocument();
  });
});
