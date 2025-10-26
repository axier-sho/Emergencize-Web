'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Heart } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface EmergencyButtonProps {
  type: 'help' | 'danger'
  onClick: () => void
  disabled?: boolean
}

export default function EmergencyButton({ type, onClick, disabled = false }: EmergencyButtonProps) {
  const isHelp = type === 'help'
  const [isLongPressing, setIsLongPressing] = useState(false)
  const [longPressProgress, setLongPressProgress] = useState(0)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  const handleMouseDown = () => {
    if (disabled) return
    
    if (isHelp) {
      onClick()
      return
    }

    // Start long press for danger button
    setIsLongPressing(true)
    setLongPressProgress(0)
    
    // Progress animation timer
    const startTime = Date.now()
    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / 3000, 1) // 3 seconds
      setLongPressProgress(progress * 100)
    }, 50)
    
    // Complete action timer
    longPressTimerRef.current = setTimeout(() => {
      onClick()
      handleMouseUp()
    }, 3000)
  }

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
    setIsLongPressing(false)
    setLongPressProgress(0)
  }

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    }
  }, [])
  
  return (
    <motion.button
      className={`emergency-button ${isHelp ? 'help-button' : 'danger-button'} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${isLongPressing ? 'long-pressing' : ''} relative overflow-hidden`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      whileHover={disabled ? {} : { 
        scale: 1.03,
      }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      animate={type === 'danger' && !disabled ? {
        boxShadow: [
          "0 20px 40px -12px rgba(239, 68, 68, 0.3), 0 0 0 0 rgba(239, 68, 68, 0)",
          "0 20px 40px -12px rgba(239, 68, 68, 0.5), 0 0 0 20px rgba(239, 68, 68, 0)",
          "0 20px 40px -12px rgba(239, 68, 68, 0.3), 0 0 0 0 rgba(239, 68, 68, 0)",
        ]
      } : {}}
      transition={{
        boxShadow: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }}
    >
      {/* Glow Effect */}
      <motion.div
        className={`absolute inset-0 rounded-3xl blur-2xl opacity-50 ${
          isHelp ? 'bg-blue-500' : 'bg-red-500'
        }`}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div
        className="relative flex flex-col items-center space-y-4 z-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Icon */}
        <motion.div
          animate={type === 'danger' && !disabled ? { 
            rotate: [0, -5, 5, -5, 0],
          } : {}}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 2
          }}
          className="relative"
        >
          {isHelp ? (
            <motion.div
              className="p-4 bg-white/20 rounded-full"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Heart size={56} className="text-white" strokeWidth={2} />
            </motion.div>
          ) : (
            <motion.div
              className="p-4 bg-white/20 rounded-full"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <AlertTriangle size={56} className="text-white" strokeWidth={2} />
            </motion.div>
          )}
          
          {/* Pulse Ring */}
          {!disabled && (
            <motion.div
              className={`absolute inset-0 rounded-full ${
                isHelp ? 'border-2 border-blue-300' : 'border-2 border-red-300'
              }`}
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          )}
        </motion.div>
        
        {/* Text */}
        <div className="text-center">
          <div className="text-3xl font-bold tracking-wider mb-2">
            {isHelp ? 'HELP' : 'DANGER'}
          </div>
          <div className="text-sm font-medium opacity-90 tracking-wide">
            {isHelp ? 'Request Assistance' : 
             isLongPressing ? `Hold for ${Math.ceil(3 - (longPressProgress/100) * 3)}s` : 
             'Hold for 3 seconds'}
          </div>
        </div>

        {/* Status Badge */}
        {!isHelp && !disabled && (
          <div className="absolute -top-4 -right-4 px-3 py-1 bg-yellow-500 text-yellow-900 text-xs font-bold rounded-full shadow-lg">
            Protected
          </div>
        )}
      </motion.div>
      
      {/* Ripple effect */}
      {!disabled && (
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut"
          }}
          style={{
            background: `radial-gradient(circle, ${
              isHelp ? 'rgba(59, 130, 246, 0.4)' : 'rgba(239, 68, 68, 0.4)'
            } 0%, transparent 70%)`
          }}
        />
      )}
      
      {/* Long Press Progress Bar */}
      {!isHelp && longPressProgress > 0 && (
        <>
          <motion.div 
            className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-400 to-red-500 opacity-20"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 3 }}
            style={{ 
              clipPath: `inset(0 ${100 - longPressProgress}% 0 0)` 
            }}
          />
          
          <motion.div 
            className="absolute bottom-0 left-0 h-2 bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 rounded-full"
            style={{ width: `${longPressProgress}%` }}
            initial={{ width: 0 }}
            transition={{ duration: 0.1 }}
          >
            <div className="absolute inset-0 bg-white/40 rounded-full animate-pulse" />
          </motion.div>
        </>
      )}

      {/* Activated Flash */}
      {isLongPressing && longPressProgress > 95 && (
        <motion.div
          className="absolute inset-0 bg-white rounded-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  )
}

}