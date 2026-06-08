// frontend/src/components/CvAnalysisResultView.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CvAnalysisResultView } from './CvAnalysisResultView';
import { RequirementRewriteBlock } from './RequirementRewriteBlock';

describe('<CvAnalysisResultView />', () => {
  it('renders score, summary, matching skills, missing skills, and rewrite sections', () => {
    render(
      <CvAnalysisResultView
        result={{
          score: 82,
          matchingSkills: ['React', 'TypeScript', 'Node.js'],
          missingSkills: ['D3', 'AI/ML product experience'],
          summary: 'Strong frontend alignment with a few domain gaps.',
          rewriteBlock: {
            withEvidence: [
              {
                requirement: 'React and TypeScript expertise',
                original: 'Built web apps.',
                revised:
                  'Built production React and TypeScript applications used by thousands of users.',
              },
            ],
            noEvidence: [
              {
                requirement: 'AI/ML product experience',
                reason: 'The CV does not show direct work on AI-powered products.',
              },
            ],
          },
        }}
      />
    );

    expect(screen.getByText(/match summary/i)).toBeInTheDocument();
    expect(screen.getByText('82%')).toBeInTheDocument();
    expect(
      screen.getByText(/strong frontend alignment with a few domain gaps\./i)
    ).toBeInTheDocument();

    expect(screen.getByText(/matching skills/i)).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();

    expect(screen.getByText(/missing skills/i)).toBeInTheDocument();
    expect(screen.getByText('D3')).toBeInTheDocument();
    expect(screen.getAllByText('AI/ML product experience')).toHaveLength(2);

    expect(
      screen.getByText(/requirements with evidence — rewritten/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/requirements with no evidence/i)
    ).toBeInTheDocument();

    expect(screen.getByText(/evidence found/i)).toBeInTheDocument();
    expect(screen.getAllByText(/no evidence/i)).toHaveLength(2);

    expect(screen.getByText(/original/i)).toBeInTheDocument();
    expect(screen.getByText(/revised/i)).toBeInTheDocument();

    expect(screen.getByText('Built web apps.')).toBeInTheDocument();
    expect(
      screen.getByText(
        /built production react and typescript applications used by thousands of users\./i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(/the cv does not show direct work on ai-powered products\./i)
    ).toBeInTheDocument();
  });

  it('renders empty-state text when matchingSkills and missingSkills are empty', () => {
    render(
      <CvAnalysisResultView
        result={{
          score: 50,
          matchingSkills: [],
          missingSkills: [],
          summary: 'Limited evidence found.',
        }}
      />
    );

    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText(/limited evidence found\./i)).toBeInTheDocument();

    expect(
      screen.getByText(/no matching skills found\./i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no missing skills identified\./i)
    ).toBeInTheDocument();
  });
});

describe('<RequirementRewriteBlock />', () => {
  it('renders nothing when rewriteBlock is undefined', () => {
    const { container } = render(<RequirementRewriteBlock />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when rewriteBlock has no content', () => {
    const { container } = render(
      <RequirementRewriteBlock
        rewriteBlock={{
          withEvidence: [],
          noEvidence: [],
        }}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders only withEvidence section when noEvidence is empty', () => {
    render(
      <RequirementRewriteBlock
        rewriteBlock={{
          withEvidence: [
            {
              requirement: 'Accessibility expertise',
              original: 'Worked on frontend.',
              revised:
                'Delivered accessible frontend experiences aligned with WCAG expectations.',
            },
          ],
          noEvidence: [],
        }}
      />
    );

    expect(
      screen.getByText(/requirements with evidence — rewritten/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/requirements with no evidence/i)).toBeNull();

    expect(screen.getByText(/^evidence found$/i)).toBeInTheDocument();
    expect(screen.getByText(/accessibility expertise/i)).toBeInTheDocument();
    expect(screen.getByText(/worked on frontend\./i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /delivered accessible frontend experiences aligned with wcag expectations\./i
      )
    ).toBeInTheDocument();
  });

  it('renders only noEvidence section when withEvidence is empty', () => {
    render(
      <RequirementRewriteBlock
        rewriteBlock={{
          withEvidence: [],
          noEvidence: [
            {
              requirement: 'Data visualization',
              reason: 'No examples of D3, charts, or dashboard work appear in the CV.',
            },
          ],
        }}
      />
    );

    expect(
      screen.queryByText(/requirements with evidence — rewritten/i)
    ).toBeNull();
    expect(
      screen.getByText(/requirements with no evidence/i)
    ).toBeInTheDocument();

    expect(screen.getByText(/^no evidence$/i)).toBeInTheDocument();
    expect(screen.getByText(/data visualization/i)).toBeInTheDocument();
    expect(
      screen.getByText(/no examples of d3, charts, or dashboard work appear in the cv\./i)
    ).toBeInTheDocument();
  });
});
