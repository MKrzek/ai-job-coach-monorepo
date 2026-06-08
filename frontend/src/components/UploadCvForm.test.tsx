// frontend/src/components/UploadCvForm.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UploadCvForm from './UploadCvForm';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4111';

describe('<UploadCvForm />', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a validation message when submitting with empty CV text', async () => {
    render(<UploadCvForm />);

    const textarea = screen.getByPlaceholderText(/paste your cv here/i);
    const form = textarea.closest('form') as HTMLFormElement;

    await fireEvent.change(textarea, { target: { value: '   ' } });
    await fireEvent.submit(form);

    expect(
      screen.getByText(/please paste your cv first\./i)
    ).toBeInTheDocument();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('calls /api/upload-cv with correct payload and shows success message', async () => {
    const mockOnUploadSuccess = vi.fn();

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, chunkCount: 3 }),
    } as Response);

    render(<UploadCvForm onUploadSuccess={mockOnUploadSuccess} />);

    const textarea = screen.getByPlaceholderText(/paste your cv here/i);
    const button = screen.getByRole('button', { name: /upload cv/i });

    await fireEvent.change(textarea, {
      target: { value: 'I built React apps with TypeScript.' },
    });

    expect(button).toBeEnabled();

    await fireEvent.click(button);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    const fetchMock = globalThis.fetch as any;
    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toBe(`${BASE_URL}/api/upload-cv`);
    expect(options).toEqual(
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const parsedBody = JSON.parse(options.body);
    expect(parsedBody).toEqual({
      userId: 'default-user',
      cvText: 'I built React apps with TypeScript.',
    });

    expect(
      await screen.findByText(/cv uploaded successfully \(3 chunks\)\./i)
    ).toBeInTheDocument();

    expect(mockOnUploadSuccess).toHaveBeenCalledTimes(1);
    expect((textarea as HTMLTextAreaElement).value).toBe('');
  });

  it('shows an error message when server returns non-ok response', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to upload CV' }),
    } as Response);

    render(<UploadCvForm />);

    const textarea = screen.getByPlaceholderText(/paste your cv here/i);
    const button = screen.getByRole('button', { name: /upload cv/i });

    await fireEvent.change(textarea, {
      target: { value: 'Some CV text' },
    });

    await fireEvent.click(button);

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    expect(
      await screen.findByText(/failed to upload cv/i)
    ).toBeInTheDocument();
  });
});
