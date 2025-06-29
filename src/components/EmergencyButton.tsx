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
    if (disabled || isHelp) {
      if (isHelp) onClick()
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
        scale: 1.05,
        boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
      }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      animate={type === 'danger' ? {
        boxShadow: [
          "0 0 0 0 rgba(239, 68, 68, 0)",
          "0 0 0 10px rgba(239, 68, 68, 0.3)",
          "0 0 0 20px rgba(239, 68, 68, 0)",
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
      <motion.div
        className="flex flex-col items-center space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          animate={type === 'danger' ? { 
            rotate: [0, -10, 10, -10, 0],
          } : {}}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 2
          }}
        >
          {isHelp ? (
            <Heart size={48} className="text-white" />
          ) : (
            <AlertTriangle size={48} className="text-white" />
          )}
        </motion.div>
        
        <div className="text-center">
          <div className="text-2xl font-bold">
            {isHelp ? 'HELP' : 'DANGER'}
          </div>
          <div className="text-sm opacity-90">
            {isHelp ? 'Request Assistance' : 
             isLongPressing ? `Hold for ${Math.ceil(3 - (longPressProgress/100) * 3)}s` : 
             'Hold for 3s'}
          </div>
        </div>
      </motion.div>
      
      {/* Ripple effect */}
      <motion.div
        className="absolute inset-0 rounded-full"
        initial={{ scale: 0, opacity: 0.5 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeOut"
        }}
        style={{
          background: `radial-gradient(circle, ${
            isHelp ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)'
          } 0%, transparent 70%)`
        }}
      />
      
      {/* Long Press Progress Bar */}
      {!isHelp && (
        <motion.div 
          className="absolute bottom-0 left-0 h-1 bg-white bg-opacity-30 rounded-full"
          style={{ width: `${longPressProgress}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${longPressProgress}%` }}
          transition={{ duration: 0.1 }}
        />
      )}
    </motion.button>
  )
}