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

type Props = {
  rewriteBlock?: RewriteBlock
}

export function RequirementRewriteBlock({ rewriteBlock }: Props) {
  if (!rewriteBlock) return null

  const { withEvidence, noEvidence } = rewriteBlock
  const hasContent = withEvidence.length > 0 || noEvidence.length > 0

  if (!hasContent) return null

  return (
    <div className="rewrite-block">
      {withEvidence.length > 0 && (
        <div style={{ marginBottom: noEvidence.length > 0 ? '20px' : 0 }}>
          <h3 className="rewrite-block__title">Requirements with Evidence — Rewritten</h3>

          <div className="rewrite-block__list">
            {withEvidence.map(item => (
              <article
                key={`${item.requirement}-${item.original}`}
                className="rewrite-block__item rewrite-block__item--evidence"
              >
                <div className="rewrite-block__header">
                  <span className="rewrite-block__badge rewrite-block__badge--evidence">
                    Evidence found
                  </span>
                  <h4 className="rewrite-block__requirement">{item.requirement}</h4>
                </div>

                <div className="rewrite-block__columns">
                  <div className="rewrite-block__panel">
                    <p className="rewrite-block__label">Original</p>
                    <p className="rewrite-block__text">{item.original}</p>
                  </div>

                  <div className="rewrite-block__panel">
                    <p className="rewrite-block__label">Revised</p>
                    <p className="rewrite-block__text">{item.revised}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {noEvidence.length > 0 && (
        <div>
          <h3 className="rewrite-block__title">Requirements with No Evidence</h3>

          <div className="rewrite-block__list">
            {noEvidence.map(item => (
              <article
                key={item.requirement}
                className="rewrite-block__item rewrite-block__item--missing"
              >
                <div className="rewrite-block__header">
                  <span className="rewrite-block__badge rewrite-block__badge--missing">
                    No evidence
                  </span>
                  <h4 className="rewrite-block__requirement">{item.requirement}</h4>
                </div>

                <p className="rewrite-block__text">{item.reason}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
