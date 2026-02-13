import { useStore } from '../store/useStore'
import { CHARACTER_STAGES } from '../lib/icons'
import { STAGE_ICONS } from './CharacterStages'

export function Character() {
  const { progress } = useStore()
  
  const points = progress?.points || 0
  
  // Find current stage based on POINTS
  const currentStageInfo = [...CHARACTER_STAGES]
    .reverse()
    .find(s => points >= s.points) || CHARACTER_STAGES[0]
  
  const currentStageIndex = CHARACTER_STAGES.findIndex(s => s.stage === currentStageInfo.stage)
  const nextStage = CHARACTER_STAGES[currentStageIndex + 1]
  
  // Calculate progress to next stage
  const stageProgress = nextStage 
    ? Math.min(100, ((points - currentStageInfo.points) / (nextStage.points - currentStageInfo.points)) * 100)
    : 100
  
  // Get the SVG icon component for current stage
  const CurrentIcon = STAGE_ICONS[currentStageInfo.stage]
  
  return (
    <div className="card bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20">
      {/* Character Display */}
      <div className="flex flex-col items-center py-4">
        <div className={`mb-4 transition-all duration-500 ${
          currentStageInfo.stage === 'butterfly' ? 'animate-float' : 
          currentStageInfo.stage === 'chrysalis' ? 'animate-pulse' : ''
        }`}>
          <CurrentIcon size={80} />
        </div>
        
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
          {currentStageInfo.name}
        </h3>
        <p className="text-sm text-gray-500 text-center mb-2">
          {currentStageInfo.description}
        </p>
        
        {/* Points Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-sm font-bold rounded-full">
            {points} очков
          </span>
        </div>
        
        {/* Progress to Next Stage */}
        {nextStage && (
          <div className="w-full">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>до "{nextStage.name}"</span>
              <span>{nextStage.points - points} очков</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
                style={{ width: `${stageProgress}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Max Stage */}
        {!nextStage && (
          <div className="text-center">
            <p className="text-sm text-accent-500 font-medium">
              максимальная стадия достигнута!
            </p>
            <p className="text-xs text-gray-500">
              собирай бабочек в свою коллекцию
            </p>
          </div>
        )}
      </div>
      
      {/* Stage Progress Icons */}
      <div className="flex justify-center items-center gap-1 pt-4 border-t border-gray-200 dark:border-gray-700">
        {CHARACTER_STAGES.map((stage, index) => {
          const isCompleted = index <= currentStageIndex
          const isCurrent = index === currentStageIndex
          const StageIcon = STAGE_ICONS[stage.stage]
          
          return (
            <div 
              key={stage.stage}
              className="flex items-center"
            >
              <div 
                className={`relative cursor-pointer transition-all ${
                  isCompleted ? 'opacity-100' : 'opacity-30 grayscale'
                } ${isCurrent ? 'scale-125 z-10' : 'scale-75'}`}
                title={`${stage.name} (${stage.points} очков)`}
              >
                <StageIcon size={32} />
              </div>
              {index < CHARACTER_STAGES.length - 1 && (
                <div className={`w-3 h-0.5 ${
                  index < currentStageIndex 
                    ? 'bg-primary-500' 
                    : 'bg-gray-300 dark:bg-gray-600'
                }`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
