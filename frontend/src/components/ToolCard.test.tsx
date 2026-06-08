// frontend/src/components/ToolCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ToolCard from './ToolCard';

describe('<ToolCard />', () => {
  it('renders tool name and score when output has a numeric score', () => {
    render(
      <ToolCard
        toolName="jdScorerTool"
        input={{ jobDescription: 'Frontend role' }}
        output={{ score: 82, summary: 'Strong match' }}
        isComplete={true}
      />
    );

    expect(screen.getByText(/🔧 jdscorertool/i)).toBeInTheDocument();
    expect(screen.getByText(/score: 82/i)).toBeInTheDocument();
    expect(screen.getByText(/▼ show/i)).toBeInTheDocument();
  });

  it('does not render score when output does not have a numeric score', () => {
    render(
      <ToolCard
        toolName="cvRetrieverTool"
        input={{ query: 'React' }}
        output={{ summary: 'Some result' }}
        isComplete={false}
      />
    );

    expect(screen.getByText(/🔧 cvretrievertool/i)).toBeInTheDocument();
    expect(screen.queryByText(/score:/i)).toBeNull();
  });

  it('expands and shows formatted input and output when clicked', () => {
    render(
      <ToolCard
        toolName="jdScorerTool"
        input={{ jobDescription: 'Frontend role' }}
        output={{ score: 82, summary: 'Strong match' }}
        isComplete={true}
      />
    );

    const trigger = screen.getByRole('button');

    // Initially closed
    expect(screen.queryByText(/input/i)).toBeNull();
    expect(screen.queryByText(/output/i)).toBeNull();

    fireEvent.click(trigger);

    expect(screen.getByText(/^input$/i)).toBeInTheDocument();
    expect(screen.getByText(/^output$/i)).toBeInTheDocument();

    // Check formatted JSON content appears
    expect(screen.getByText(/frontend role/i)).toBeInTheDocument();
    expect(screen.getByText(/strong match/i)).toBeInTheDocument();

    expect(screen.getByText(/▲ hide/i)).toBeInTheDocument();
  });

  it('collapses again when clicked a second time', () => {
    render(
      <ToolCard
        toolName="jdScorerTool"
        input={{ jobDescription: 'Frontend role' }}
        output={{ score: 82, summary: 'Strong match' }}
        isComplete={true}
      />
    );

    const trigger = screen.getByRole('button');

    fireEvent.click(trigger);
    expect(screen.getByText(/^input$/i)).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.queryByText(/^input$/i)).toBeNull();
    expect(screen.queryByText(/^output$/i)).toBeNull();

    expect(screen.getByText(/▼ show/i)).toBeInTheDocument();
  });

  it('shows input but not output section when output is undefined', () => {
    render(
      <ToolCard
        toolName="someTool"
        input={{ query: 'test' }}
        output={undefined}
        isComplete={false}
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    expect(screen.getByText(/^input$/i)).toBeInTheDocument();
    expect(screen.getByText(/test/i)).toBeInTheDocument();
    expect(screen.queryByText(/^output$/i)).toBeNull();
  });
});
