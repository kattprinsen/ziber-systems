interface VisualSliderProps {
  currentSalary: number | null;
  proposedSalary: number | null;
  percentageChange: number;
  className?: string;
}

export function VisualSlider({
  currentSalary,
  proposedSalary,
  percentageChange,
  className = ''
}: VisualSliderProps) {
  // If no data, show empty state
  if (currentSalary === null || currentSalary === 0 || proposedSalary === null) {
    return (
      <div className={`p-6 bg-gray-800 rounded-lg ${className}`}>
        <div className="text-center text-gray-500">
          <svg 
            className="w-16 h-16 mx-auto mb-3 opacity-30" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
            />
          </svg>
          <p className="text-sm">Visual comparison will appear here</p>
        </div>
      </div>
    );
  }

  // Determine color based on percentage change
  const isIncrease = percentageChange > 0;
  const isDecrease = percentageChange < 0;
  const colorClass = isIncrease 
    ? 'bg-gradient-to-r from-gray-700 to-orange-500' 
    : isDecrease 
    ? 'bg-gradient-to-r from-gray-700 to-red-500'
    : 'bg-gray-700';
  
  const barColorClass = isIncrease
    ? 'bg-orange-500'
    : isDecrease
    ? 'bg-red-500'
    : 'bg-gray-500';

  // Calculate scale for better visualization
  const absPercentage = Math.abs(percentageChange);
  let scale = 20; // Default scale for medium changes
  
  if (absPercentage < 5) {
    scale = 10; // Smaller scale for small changes
  } else if (absPercentage > 20) {
    scale = 50; // Larger scale for big changes
  }

  // Calculate position on slider (0-100%)
  // Current salary is always at 0%, proposed salary position depends on percentage
  const maxPercentageOnScale = scale;
  const sliderPosition = Math.min(Math.max((percentageChange / maxPercentageOnScale) * 100, -100), 100);
  const fillWidth = Math.abs(sliderPosition);
  
  return (
    <div className={`p-6 bg-gray-800 rounded-lg ${className}`}>
      <h3 className="text-lg font-medium text-gray-200 mb-6">Visual Comparison</h3>
      
      {/* Scale indicator */}
      <div className="text-xs text-gray-400 mb-2 text-right">
        Scale: ±{scale}%
      </div>

      {/* Slider container */}
      <div className="relative h-32 mb-6">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-600 -translate-x-1/2" />
        
        {/* Current salary marker (always at center) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="relative">
            <div className="w-4 h-4 rounded-full bg-gray-400 border-2 border-gray-900" />
            <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="text-xs text-gray-400">Current</span>
            </div>
          </div>
        </div>

        {/* Fill bar showing change direction */}
        {sliderPosition !== 0 && (
          <div 
            className={`absolute top-1/2 -translate-y-1/2 h-2 ${colorClass} transition-all duration-300`}
            style={{
              left: sliderPosition < 0 ? `calc(50% - ${fillWidth}%)` : '50%',
              width: `${fillWidth}%`
            }}
          />
        )}

        {/* Proposed salary marker */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 z-10 transition-all duration-300"
          style={{
            left: `calc(50% + ${sliderPosition}%)`
          }}
        >
          <div className="relative -translate-x-1/2">
            <div className={`w-5 h-5 rounded-full ${barColorClass} border-2 border-gray-900 shadow-lg animate-pulse`} />
            <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className={`text-xs font-semibold ${isIncrease ? 'text-orange-500' : isDecrease ? 'text-red-500' : 'text-gray-400'}`}>
                Proposed
              </span>
            </div>
          </div>
        </div>

        {/* Scale markers */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
          <span>-{scale}%</span>
          <span>0%</span>
          <span>+{scale}%</span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400 border border-gray-600" />
          <span className="text-gray-400">Current Salary</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${barColorClass} border border-gray-900`} />
          <span className={isIncrease ? 'text-orange-500' : isDecrease ? 'text-red-500' : 'text-gray-400'}>
            Proposed Salary
          </span>
        </div>
      </div>
    </div>
  );
}
