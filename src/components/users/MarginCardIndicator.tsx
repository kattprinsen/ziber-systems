interface MarginCardIndicatorProps {
  hourlyRate?: number | null;
}

/**
 * Static indicator shown on user cards.
 * Makes NO API calls — purely derived from the user's hourlyRate field.
 *
 * US2: shows "Margin available" when rate is configured,
 *      "Rate not set" (muted) when absent.
 *
 * Note: this component renders a plain badge (no Link), because it is
 * always rendered inside the UserCard which is itself an anchor element.
 * Clicking the card navigates to the user detail page where the full
 * Margin Contribution panel is shown.
 */
export function MarginCardIndicator({ hourlyRate }: MarginCardIndicatorProps) {
  const hasRate = typeof hourlyRate === 'number' && hourlyRate > 0;

  if (hasRate) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-teal-500/15 text-teal-400 border border-teal-500/30">
        <span aria-hidden>↗</span>
        Margin available
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-text-secondary/60 border border-dark-border">
      Rate not set
    </span>
  );
}
