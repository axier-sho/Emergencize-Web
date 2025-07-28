'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Home, 
  Briefcase, 
  GraduationCap, 
  Hospital,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Navigation
} from 'lucide-react'
import { geofencingService, SafeZone, GeofenceEvent, GeofenceAlert } from '@/services/GeofencingService'
import { locationService, Location } from '@/services/LocationService'
import { useAccessibilityContext } from '../accessibility/AccessibilityProvider'

interface GeofenceManagerProps {
  isOpen: boolean
  onClose: () => void
}

export default function GeofenceManager({ isOpen, onClose }: GeofenceManagerProps) {
  const [safeZones, setSafeZones] = useState<SafeZone[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [currentZones, setCurrentZones] = useState<SafeZone[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingZone, setEditingZone] = useState<SafeZone | null>(null)
  const [newZone, setNewZone] = useState({
    name: '',
    type: 'custom' as SafeZone['type'],
    radiusMeters: 100,
    description: '',
    color: '#3b82f6'
  })
  const [recentEvents, setRecentEvents] = useState<GeofenceEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { announce, playAudioCue } = useAccessibilityContext()

  useEffect(() => {
    if (isOpen) {
      loadSafeZones()
      updateStatus()
      loadRecentEvents()
      
      // Set up event listeners
      const unsubscribeEvent = geofencingService.onGeofenceEvent(handleGeofenceEvent)
      const unsubscribeAlert = geofencingService.onGeofenceAlert(handleGeofenceAlert)
      
      return () => {
        unsubscribeEvent()
        unsubscribeAlert()
      }
    }
  }, [isOpen])

  const loadSafeZones = () => {
    const zones = geofencingService.getSafeZones()
    setSafeZones(zones)
  }

  const updateStatus = () => {
    const status = geofencingService.getCurrentStatus()
    setIsMonitoring(status.isWatching)
    setCurrentLocation(status.currentLocation)
    setCurrentZones(status.currentZones)
  }

  const loadRecentEvents = () => {
    const events = geofencingService.getStoredEvents()
    setRecentEvents(events.slice(-10).reverse()) // Last 10 events, newest first
  }

  const handleGeofenceEvent = (event: GeofenceEvent) => {
    console.log('Geofence event:', event)
    loadRecentEvents()
    updateStatus()
    
    // Announce to screen reader
    announce(`${event.type === 'enter' ? 'Entered' : 'Left'} safe zone: ${event.safeZone.name}`)
    playAudioCue(event.type === 'enter' ? 'success' : 'info')
  }

  const handleGeofenceAlert = (alert: GeofenceAlert) => {
    console.log('Geofence alert:', alert)
    
    // Announce critical alerts
    if (alert.severity === 'high') {
      announce(alert.message, 'assertive')
      playAudioCue('warning')
    }
  }

  const startMonitoring = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const started = await geofencingService.startMonitoring()
      if (started) {
        setIsMonitoring(true)
        announce('Geofence monitoring started')
        playAudioCue('success')
      } else {
        throw new Error('Failed to start monitoring')
      }
    } catch (err) {
      const errorMessage = 'Failed to start geofence monitoring'
      setError(errorMessage)
      announce(errorMessage)
      playAudioCue('error')
    } finally {
      setIsLoading(false)
    }
  }

  const stopMonitoring = () => {
    geofencingService.stopMonitoring()
    setIsMonitoring(false)
    announce('Geofence monitoring stopped')
    playAudioCue('info')
  }

  const addSafeZone = async () => {
    try {
      if (!newZone.name.trim()) {
        throw new Error('Zone name is required')
      }

      setIsLoading(true)
      setError(null)

      // Get current location for zone center
      let center = currentLocation
      if (!center) {
        center = await locationService.getCurrentPosition()
        setCurrentLocation(center)
      }

      const zone = geofencingService.addSafeZone({
        ...newZone,
        center,
        isActive: true
      })

      loadSafeZones()
      setShowAddForm(false)
      setNewZone({
        name: '',
        type: 'custom',
        radiusMeters: 100,
        description: '',
        color: '#3b82f6'
      })

      announce(`Safe zone "${zone.name}" added`)
      playAudioCue('success')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add safe zone'
      setError(errorMessage)
      announce(errorMessage)
      playAudioCue('error')
    } finally {
      setIsLoading(false)
    }
  }

  const updateSafeZone = (id: string, updates: Partial<SafeZone>) => {
    const success = geofencingService.updateSafeZone(id, updates)
    if (success) {
      loadSafeZones()
      updateStatus()
      announce('Safe zone updated')
      playAudioCue('success')
    }
  }

  const deleteSafeZone = (id: string, name: string) => {
    if (window.confirm(`Delete safe zone "${name}"?`)) {
      const success = geofencingService.removeSafeZone(id)
      if (success) {
        loadSafeZones()
        updateStatus()
        announce(`Safe zone "${name}" deleted`)
        playAudioCue('info')
      }
    }
  }

  const getZoneIcon = (type: SafeZone['type']) => {
    switch (type) {
      case 'home': return <Home size={16} />
      case 'work': return <Briefcase size={16} />
      case 'school': return <GraduationCap size={16} />
      case 'hospital': return <Hospital size={16} />
      default: return <MapPin size={16} />
    }
  }

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${meters}m`
    }
    return `${(meters / 1000).toFixed(1)}km`
  }

  if (!isOpen) return null

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="glass-effect rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="geofence-manager-title"
        aria-describedby="geofence-manager-description"
      >
        {/* Header */}
        <div className="p-6 border-b border-white border-opacity-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <MapPin size={24} className="text-white" />
              </div>
              <div>
                <h2 id="geofence-manager-title" className="text-2xl font-bold text-white">
                  Safe Zone Manager
                </h2>
                <p id="geofence-manager-description" className="text-blue-200 text-sm">
                  Manage your safe zones and location-based alerts
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2"
              aria-label="Close safe zone manager"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row h-full max-h-[calc(90vh-120px)]">
          {/* Left Panel - Controls */}
          <div className="lg:w-1/3 p-6 border-r border-white border-opacity-20 space-y-6">
            {/* Status */}
            <div className="bg-white bg-opacity-5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
                <Settings size={20} className="text-blue-400" />
                <span>Monitoring Status</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Active Monitoring</span>
                  <div className={`flex items-center space-x-2 ${isMonitoring ? 'text-green-400' : 'text-gray-400'}`}>
                    {isMonitoring ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    <span className="text-sm">{isMonitoring ? 'On' : 'Off'}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Current Zones</span>
                  <span className="text-blue-400 text-sm">{currentZones.length}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Total Zones</span>
                  <span className="text-blue-400 text-sm">{safeZones.length}</span>
                </div>
              </div>

              <div className="mt-4">
                {!isMonitoring ? (
                  <motion.button
                    onClick={startMonitoring}
                    disabled={isLoading}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? 'Starting...' : 'Start Monitoring'}
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={stopMonitoring}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Stop Monitoring
                  </motion.button>
                )}
              </div>
            </div>

            {/* Add Zone Button */}
            <motion.button
              onClick={() => setShowAddForm(true)}
              className="w-full p-4 border-2 border-dashed border-blue-400 border-opacity-50 rounded-lg text-blue-400 hover:bg-blue-400 hover:bg-opacity-10 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={24} className="mx-auto mb-2" />
              <span className="block font-medium">Add Safe Zone</span>
            </motion.button>

            {/* Recent Events */}
            <div className="bg-white bg-opacity-5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
                <Navigation size={20} className="text-blue-400" />
                <span>Recent Activity</span>
              </h3>
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {recentEvents.length === 0 ? (
                  <p className="text-gray-400 text-sm">No recent activity</p>
                ) : (
                  recentEvents.map((event) => (
                    <div key={event.id} className="p-2 bg-white bg-opacity-5 rounded text-xs">
                      <div className={`flex items-center space-x-1 ${
                        event.type === 'enter' ? 'text-green-400' : 'text-orange-400'
                      }`}>
                        {event.type === 'enter' ? '→' : '←'}
                        <span>{event.safeZone.name}</span>
                      </div>
                      <div className="text-gray-400 mt-1">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Zone List */}
          <div className="lg:w-2/3 p-6 overflow-y-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-400 border-opacity-50 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-white font-semibold text-lg">Safe Zones ({safeZones.length})</h3>
              
              <AnimatePresence>
                {safeZones.map((zone) => (
                  <motion.div
                    key={zone.id}
                    className="bg-white bg-opacity-5 rounded-lg p-4 border border-white border-opacity-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    layout
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: zone.color }}
                        >
                          {getZoneIcon(zone.type)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="text-white font-medium">{zone.name}</h4>
                            {currentZones.some(z => z.id === zone.id) && (
                              <span className="px-2 py-1 bg-green-600 bg-opacity-20 text-green-400 text-xs rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                          
                          <p className="text-gray-300 text-sm mb-2">
                            {zone.description || `${zone.type.charAt(0).toUpperCase()}${zone.type.slice(1)} zone`}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <span>Radius: {formatDistance(zone.radiusMeters)}</span>
                            <span>Type: {zone.type}</span>
                            <span className={zone.isActive ? 'text-green-400' : 'text-gray-500'}>
                              {zone.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <motion.button
                          onClick={() => updateSafeZone(zone.id, { isActive: !zone.isActive })}
                          className={`p-2 rounded transition-colors ${
                            zone.isActive 
                              ? 'text-green-400 hover:bg-green-400 hover:bg-opacity-20' 
                              : 'text-gray-400 hover:bg-gray-400 hover:bg-opacity-20'
                          }`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          aria-label={`${zone.isActive ? 'Deactivate' : 'Activate'} ${zone.name}`}
                        >
                          {zone.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                        </motion.button>
                        
                        <motion.button
                          onClick={() => setEditingZone(zone)}
                          className="p-2 text-blue-400 hover:bg-blue-400 hover:bg-opacity-20 rounded transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          aria-label={`Edit ${zone.name}`}
                        >
                          <Edit size={16} />
                        </motion.button>
                        
                        <motion.button
                          onClick={() => deleteSafeZone(zone.id, zone.name)}
                          className="p-2 text-red-400 hover:bg-red-400 hover:bg-opacity-20 rounded transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          aria-label={`Delete ${zone.name}`}
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {safeZones.length === 0 && (
                <div className="text-center py-8">
                  <MapPin size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 text-lg mb-2">No safe zones configured</p>
                  <p className="text-gray-400 text-sm">
                    Add your first safe zone to start monitoring your location
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Add Zone Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-60 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              className="glass-effect rounded-xl w-full max-w-md p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Add Safe Zone</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Zone Name</label>
                  <input
                    type="text"
                    value={newZone.name}
                    onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                    className="w-full p-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400"
                    placeholder="e.g., Home, Office, School"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Zone Type</label>
                  <select
                    value={newZone.type}
                    onChange={(e) => setNewZone({ ...newZone, type: e.target.value as SafeZone['type'] })}
                    className="w-full p-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white"
                  >
                    <option value="custom">Custom</option>
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="school">School</option>
                    <option value="hospital">Hospital</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm mb-2">
                    Radius ({formatDistance(newZone.radiusMeters)})
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="1000"
                    step="50"
                    value={newZone.radiusMeters}
                    onChange={(e) => setNewZone({ ...newZone, radiusMeters: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Description</label>
                  <textarea
                    value={newZone.description}
                    onChange={(e) => setNewZone({ ...newZone, description: e.target.value })}
                    className="w-full p-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400"
                    placeholder="Optional description"
                    rows={2}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <motion.button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                
                <motion.button
                  onClick={addSafeZone}
                  disabled={isLoading || !newZone.name.trim()}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? 'Adding...' : 'Add Zone'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}