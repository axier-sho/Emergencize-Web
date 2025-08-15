'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Users,
  Shield,
  Settings,
  BarChart3,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Filter,
  Search,
  Eye,
  EyeOff,
  Crown,
  Star,
  TrendingUp,
  TrendingDown,
  Activity,
  Globe,
  Lock
} from 'lucide-react'
import OrganizationService, { 
  Organization, 
  OrganizationGroup, 
  OrganizationAnalytics,
  OrganizationInvitation 
} from '@/services/OrganizationService'
import { useAuth } from '@/hooks/useAuth'

interface OrganizationDashboardProps {
  organizationId?: string
  className?: string
}

export function OrganizationDashboard({ organizationId, className = '' }: OrganizationDashboardProps) {
  const { user } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null)
  const [groups, setGroups] = useState<OrganizationGroup[]>([])
  const [analytics, setAnalytics] = useState<OrganizationAnalytics | null>(null)
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'groups' | 'users' | 'analytics' | 'settings'>('overview')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [showCreateOrg, setShowCreateOrg] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showInviteUsers, setShowInviteUsers] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Form states
  const [newOrgForm, setNewOrgForm] = useState({
    name: '',
    type: 'business' as Organization['type'],
    description: '',
    industry: '',
    size: 'medium' as Organization['size'],
    contactEmail: '',
    contactPhone: '',
    website: ''
  })

  const [newGroupForm, setNewGroupForm] = useState({
    name: '',
    description: '',
    type: 'department' as OrganizationGroup['type'],
    parentGroupId: '',
    isEmergencyGroup: false
  })

  const [inviteForm, setInviteForm] = useState({
    emails: '',
    role: 'member',
    message: '',
    groupIds: [] as string[]
  })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      setError(null)
      
      // Load organizations
      const orgs = OrganizationService.getOrganizations()
      setOrganizations(orgs)

      // Set selected organization
      let selectedOrg = null
      if (organizationId) {
        selectedOrg = orgs.find(org => org.id === organizationId) || null
      } else if (orgs.length > 0) {
        selectedOrg = orgs[0]
      }
      setSelectedOrganization(selectedOrg)

      if (selectedOrg) {
        // Load groups
        const orgGroups = OrganizationService.getGroups(selectedOrg.id)
        setGroups(orgGroups)

        // Load invitations
        const orgInvitations = OrganizationService.getInvitations(selectedOrg.id)
        setInvitations(orgInvitations)

        // Load analytics
        const analyticsData = await OrganizationService.generateAnalytics(selectedOrg.id, 'month')
        setAnalytics(analyticsData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    loadData()

    // Set up event listeners
    const handleOrgCreated = () => loadData()
    const handleGroupCreated = () => loadData()
    const handleUsersInvited = () => loadData()

    OrganizationService.on('organizationCreated', handleOrgCreated)
    OrganizationService.on('groupCreated', handleGroupCreated)
    OrganizationService.on('usersInvited', handleUsersInvited)

    return () => {
      OrganizationService.off('organizationCreated', handleOrgCreated)
      OrganizationService.off('groupCreated', handleGroupCreated)
      OrganizationService.off('usersInvited', handleUsersInvited)
    }
  }, [loadData])

  const handleCreateOrganization = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const result = await OrganizationService.createOrganization({
        name: newOrgForm.name,
        type: newOrgForm.type,
        description: newOrgForm.description,
        industry: newOrgForm.industry,
        size: newOrgForm.size,
        contactInfo: {
          email: newOrgForm.contactEmail,
          phone: newOrgForm.contactPhone,
          website: newOrgForm.website
        },
        createdBy: user.uid
      })

      if (result) {
        setShowCreateOrg(false)
        setNewOrgForm({
          name: '',
          type: 'business',
          description: '',
          industry: '',
          size: 'medium',
          contactEmail: '',
          contactPhone: '',
          website: ''
        })
        await loadData()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!user || !selectedOrganization) return

    try {
      setIsLoading(true)
      const result = await OrganizationService.createGroup({
        organizationId: selectedOrganization.id,
        name: newGroupForm.name,
        description: newGroupForm.description,
        type: newGroupForm.type,
        parentGroupId: newGroupForm.parentGroupId || undefined,
        emergencyConfig: {
          isEmergencyGroup: newGroupForm.isEmergencyGroup
        },
        createdBy: user.uid
      })

      if (result) {
        setShowCreateGroup(false)
        setNewGroupForm({
          name: '',
          description: '',
          type: 'department',
          parentGroupId: '',
          isEmergencyGroup: false
        })
        await loadData()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInviteUsers = async () => {
    if (!user || !selectedOrganization) return

    try {
      setIsLoading(true)
      const emails = inviteForm.emails
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0)

      if (emails.length === 0) {
        throw new Error('Please enter at least one email address')
      }

      const result = await OrganizationService.inviteUsers({
        organizationId: selectedOrganization.id,
        emails,
        role: inviteForm.role,
        groupIds: inviteForm.groupIds.length > 0 ? inviteForm.groupIds : undefined,
        message: inviteForm.message || undefined,
        invitedBy: user.uid
      })

      if (result.length > 0) {
        setShowInviteUsers(false)
        setInviteForm({
          emails: '',
          role: 'member',
          message: '',
          groupIds: []
        })
        await loadData()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite users')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: Organization['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'trial': return 'text-blue-600 bg-blue-100'
      case 'suspended': return 'text-red-600 bg-red-100'
      case 'expired': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getGroupTypeIcon = (type: OrganizationGroup['type']) => {
    switch (type) {
      case 'department': return <Building2 className="w-4 h-4" />
      case 'team': return <Users className="w-4 h-4" />
      case 'emergency_response': return <AlertTriangle className="w-4 h-4" />
      case 'location': return <MapPin className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  if (isLoading && organizations.length === 0) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading organizations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Organization Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage organizations, groups, and members
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {selectedOrganization && (
            <>
              <motion.button
                onClick={() => setShowInviteUsers(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite Users</span>
              </motion.button>
              
              <motion.button
                onClick={() => setShowCreateGroup(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-4 h-4" />
                <span>New Group</span>
              </motion.button>
            </>
          )}
          
          <motion.button
            onClick={() => setShowCreateOrg(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            <span>New Organization</span>
          </motion.button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-600"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Organization Selector */}
      {organizations.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Organization
          </label>
          <select
            value={selectedOrganization?.id || ''}
            onChange={(e) => {
              const org = organizations.find(o => o.id === e.target.value)
              setSelectedOrganization(org || null)
            }}
            className="w-full max-w-md p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Select an organization...</option>
            {organizations.map(org => (
              <option key={org.id} value={org.id}>
                {org.name} ({org.type})
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedOrganization ? (
        <>
          {/* Organization Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                
                <div>
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {selectedOrganization.name}
                    </h2>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrganization.status)}`}>
                      {selectedOrganization.status}
                    </span>
                    {selectedOrganization.isVerified && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {selectedOrganization.description || 'No description provided'}
                  </p>
                  
                  <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{selectedOrganization.subscription.maxUsers} users max</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Building2 className="w-4 h-4" />
                      <span>{selectedOrganization.type}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Created {new Date(selectedOrganization.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Settings className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'groups', label: 'Groups', icon: Users },
                { id: 'users', label: 'Users & Invitations', icon: UserPlus },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Quick Stats */}
                {analytics && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {formatNumber(analytics.users.total)}
                          </p>
                          <p className="text-xs text-green-600 flex items-center space-x-1 mt-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>+{analytics.users.new} this month</span>
                          </p>
                        </div>
                        <Users className="w-8 h-8 text-blue-500" />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Active Groups</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {analytics.groups.active}
                          </p>
                          <p className="text-xs text-gray-500">
                            of {analytics.groups.total} total
                          </p>
                        </div>
                        <Building2 className="w-8 h-8 text-green-500" />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Emergency Alerts</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {analytics.emergencyResponse.totalAlerts}
                          </p>
                          <p className="text-xs text-blue-600">
                            {(analytics.emergencyResponse.resolutionRate * 100).toFixed(1)}% resolved
                          </p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {analytics.emergencyResponse.responseTime.average.toFixed(1)}m
                          </p>
                          <p className="text-xs text-gray-500">
                            Median: {analytics.emergencyResponse.responseTime.median.toFixed(1)}m
                          </p>
                        </div>
                        <Clock className="w-8 h-8 text-purple-500" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <UserPlus className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          5 new users invited to Emergency Response Team
                        </p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Building2 className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          New group "IT Department" created
                        </p>
                        <p className="text-xs text-gray-500">1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          Emergency alert resolved in 4.2 minutes
                        </p>
                        <p className="text-xs text-gray-500">3 days ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'groups' && (
              <motion.div
                key="groups"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups.map(group => (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                            {getGroupTypeIcon(group.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {group.name}
                            </h3>
                            <p className="text-sm text-gray-500 capitalize">
                              {group.type.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        
                        {group.emergencyConfig.isEmergencyGroup && (
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      
                      {group.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {group.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {group.members.length} members
                        </span>
                        <span className="text-gray-500">
                          Level {group.level}
                        </span>
                      </div>
                      
                      {group.childGroups.length > 0 && (
                        <p className="text-xs text-blue-600 mt-2">
                          {group.childGroups.length} sub-groups
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Pending Invitations
                  </h3>
                  
                  {invitations.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No pending invitations
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {invitations.filter(inv => inv.status === 'pending').map(invitation => (
                        <div key={invitation.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Mail className="w-5 h-5 text-blue-500" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {invitation.email}
                              </p>
                              <p className="text-sm text-gray-500">
                                Role: {invitation.role} • Invited {new Date(invitation.createdAt).toLocaleDateString()}
                              </p>
                              {invitation.message && (
                                <p className="text-xs text-gray-400 mt-1">
                                  "{invitation.message}"
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              Pending
                            </span>
                            <button className="text-gray-400 hover:text-red-500">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Organizations Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first organization to get started with group management and emergency response coordination.
          </p>
          <motion.button
            onClick={() => setShowCreateOrg(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Create Organization
          </motion.button>
        </div>
      )}

      {/* Create Organization Modal */}
      {showCreateOrg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Create New Organization
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    value={newOrgForm.name}
                    onChange={(e) => setNewOrgForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Enter organization name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Organization Type *
                  </label>
                  <select
                    value={newOrgForm.type}
                    onChange={(e) => setNewOrgForm(prev => ({ ...prev, type: e.target.value as Organization['type'] }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="business">Business</option>
                    <option value="school">School</option>
                    <option value="nonprofit">Non-profit</option>
                    <option value="government">Government</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="family">Family</option>
                    <option value="community">Community</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newOrgForm.description}
                  onChange={(e) => setNewOrgForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={3}
                  placeholder="Describe your organization"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={newOrgForm.industry}
                    onChange={(e) => setNewOrgForm(prev => ({ ...prev, industry: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="e.g., Technology, Healthcare"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Organization Size *
                  </label>
                  <select
                    value={newOrgForm.size}
                    onChange={(e) => setNewOrgForm(prev => ({ ...prev, size: e.target.value as Organization['size'] }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="small">Small (1-25 users)</option>
                    <option value="medium">Medium (26-100 users)</option>
                    <option value="large">Large (101-500 users)</option>
                    <option value="enterprise">Enterprise (500+ users)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    value={newOrgForm.contactEmail}
                    onChange={(e) => setNewOrgForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="contact@organization.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newOrgForm.contactPhone}
                    onChange={(e) => setNewOrgForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={newOrgForm.website}
                  onChange={(e) => setNewOrgForm(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="https://www.organization.com"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateOrg(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Cancel
              </button>
              <motion.button
                onClick={handleCreateOrganization}
                disabled={!newOrgForm.name || !newOrgForm.contactEmail || isLoading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? 'Creating...' : 'Create Organization'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Similar modals for Create Group and Invite Users would go here */}
      {/* ... (CreateGroup and InviteUsers modals implementation) */}
    </div>
  )
}

export default OrganizationDashboard