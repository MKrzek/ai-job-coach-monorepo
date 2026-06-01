import { RequirementRewriteBlock } from './RequirementRewriteBlock'

type RequirementRewrite = {
  requirement: string
  original: string
  revised: string
}

type MissingRequirement = {
  requirement: string
  reason: string
}

type RewriteBlock = {
  withEvidence: RequirementRewrite[]
  noEvidence: MissingRequirement[]
}

type CvAnalysisResult = {
  score: number
  matchingSkills: string[]
  missingSkills: string[]
  summary: string
  rewriteBlock?: RewriteBlock
}

type Props = {
  result: CvAnalysisResult
}

export function CvAnalysisResultView({ result }: Props) {
  return (
    <div className="cv-result">
      <section className="cv-result__section">
        <div className="cv-result__score-row">
          <div>
            <h2 className="cv-result__title">Match Summary</h2>
            <p className="cv-result__subtitle">Evidence-based CV analysis for this role.</p>
          </div>

          <div className="cv-result__score">{result.score}%</div>
        </div>

        <p className="cv-result__summary" style={{ marginTop: '12px' }}>
          {result.summary}
        </p>
      </section>

      <section className="cv-result__section">
        <div className="cv-result__grid">
          <div className="cv-result__card">
            <h3 className="cv-result__card-title">Matching Skills</h3>

            {result.matchingSkills.length > 0 ? (
              <ul className="cv-result__chips">
                {result.matchingSkills.map(skill => (
                  <li key={skill} className="cv-result__chip cv-result__chip--match">
                    {skill}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="cv-result__empty">No matching skills found.</p>
            )}
          </div>

          <div className="cv-result__card">
            <h3 className="cv-result__card-title">Missing Skills</h3>

            {result.missingSkills.length > 0 ? (
              <ul className="cv-result__chips">
                {result.missingSkills.map(skill => (
                  <li key={skill} className="cv-result__chip cv-result__chip--missing">
                    {skill}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="cv-result__empty">No missing skills identified.</p>
            )}
          </div>
        </div>
      </section>

      <section className="cv-result__section">
        <RequirementRewriteBlock rewriteBlock={result.rewriteBlock} />
      </section>
    </div>
  )
}