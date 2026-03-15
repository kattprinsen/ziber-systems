import { render } from '@testing-library/react';
import React from 'react';
import { GroupPerformanceChart } from '../../../src/components/dashboard';
import type { ChartDataPoint } from '../../../src/types/performance';

function renderWithWidth(ui: React.ReactElement) {
  return render(
    <div style={{ width: 800, height: 400 }}>
      {ui}
    </div>
  );
}

describe('GroupPerformanceChart', () => {
  it('renders without crashing when SEK values are present', () => {
    const data: ChartDataPoint[] = [
      {
        month: 'Mar',
        hours: 160,
        sek: 160000,
        isPartial: false,
        key: '2026-03',
      },
    ];

    renderWithWidth(
      <GroupPerformanceChart
        data={data}
        target={200}
        selectedKey="2026-03"
      />
    );
  });

  it('renders an empty state when there is no data', () => {
    const { getByText } = renderWithWidth(
      <GroupPerformanceChart
        data={[]}
        target={null}
        selectedKey={null}
      />
    );

    expect(getByText(/No performance data available/i)).toBeInTheDocument();
  });
});
