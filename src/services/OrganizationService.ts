import { ValidationService } from './ValidationService'
import { SecurityMonitoringService } from './SecurityMonitoringService'
import { RateLimitService } from './RateLimitService'

export interface Organization {
  id: string
  name: string
  type: 'business' | 'school' | 'nonprofit' | 'government' | 'healthcare' | 'family' | 'community'
  description?: string
  industry?: string
  size: 'small' | 'medium' | 'large' | 'enterprise'
  
  // Contact information
  contactInfo: {
    email: string
    phone?: string
    website?: string
    address?: {
      street: string
      city: string
      state: string
      country: string
      postalCode: string
    }
  }
  
  // Settings
  settings: OrganizationSettings
  
  // Subscription and limits
  subscription: {
    plan: 'free' | 'basic' | 'professional' | 'enterprise'
    maxUsers: number
    maxGroups: number
    features: string[]
    expiresAt?: string
  }
  
  // Status
  status: 'active' | 'suspended' | 'trial' | 'expired'
  isVerified: boolean
  
  // Timestamps
  createdAt: string
  updatedAt: string
  createdBy: string // User ID of organization creator
}

export interface OrganizationSettings {
  // Emergency response settings
  emergencyResponse: {
    autoEscalationEnabled: boolean
    escalationTimeoutMinutes: number
    requireManagerApproval: boolean
    emergencyContactRequired: boolean
    locationTrackingRequired: boolean
  }
  
  // Privacy and data settings
  privacy: {
    allowMemberLocationSharing: boolean
    defaultLocationPrecision: 'approximate' | 'precise'
    dataRetentionDays: number
    allowDataExport: boolean
    requireConsentForSharing: boolean
  }
  
  // Communication settings
  communication: {
    allowDirectMessaging: boolean
    moderateGroupMessages: boolean
    allowFileSharing: boolean
    maxFileSize: number // MB
    allowedFileTypes: string[]
  }
  
  // Security settings
  security: {
    requireTwoFactor: boolean
    passwordPolicy: {
      minLength: number
      requireSpecialChars: boolean
      requireNumbers: boolean
      expirationDays?: number
    }
    allowedEmailDomains?: string[]
    ipWhitelist?: string[]
    sessionTimeoutMinutes: number
  }
  
  // Group management
  groups: {
    allowMemberCreateGroups: boolean
    requireApprovalForGroups: boolean
    maxGroupSize: number
    allowNestedGroups: boolean
    defaultGroupPrivacy: 'public' | 'private' | 'invite_only'
  }
  
  // Audit and compliance
  audit: {
    logAllActivities: boolean
    retainLogsForDays: number
    allowMemberDataAccess: boolean
    complianceStandards: string[] // HIPAA, GDPR, etc.
  }
}

export interface OrganizationGroup {
  id: string
  organizationId: string
  name: string
  description?: string
  type: 'department' | 'team' | 'project' | 'location' | 'emergency_response' | 'custom'
  
  // Hierarchy
  parentGroupId?: string
  childGroups: string[] // Group IDs
  level: number // 0 = top level, 1 = sub-group, etc.
  
  // Members
  members: GroupMember[]
  maxMembers?: number
  
  // Settings
  settings: GroupSettings
  
  // Emergency response
  emergencyConfig: {
    isEmergencyGroup: boolean
    responseTimeMinutes?: number
    escalationChain: string[] // User IDs in order
    emergencyContacts: string[] // External contact IDs
    alertTypes: string[] // Types of alerts this group handles
  }
  
  // Permissions
  permissions: GroupPermissions
  
  // Status
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface GroupMember {
  userId: string
  role: 'owner' | 'admin' | 'moderator' | 'member' | 'viewer'
  permissions: string[]
  joinedAt: string
  invitedBy?: string
  status: 'active' | 'inactive' | 'pending' | 'banned'
  
  // Emergency response role
  emergencyRole?: {
    title: string
    responsibilities: string[]
    priority: number // 1 = highest priority
    isOnCall: boolean
    certifications: string[]
  }
}

export interface GroupSettings {
  privacy: 'public' | 'private' | 'invite_only'
  allowMemberInvites: boolean
  requireApprovalToJoin: boolean
  allowMemberExit: boolean
  
  // Communication
  communication: {
    allowMessages: boolean
    allowFileSharing: boolean
    moderateMessages: boolean
    allowBroadcast: boolean
    quietHours?: {
      enabled: boolean
      startTime: string
      endTime: string
      timezone: string
    }
  }
  
  // Location and tracking
  location: {
    allowLocationSharing: boolean
    trackMemberLocations: boolean
    geofenceEnabled: boolean
    geofenceRadius?: number
    locationUpdateInterval: number
  }
  
  // Emergency alerts
  alerts: {
    allowEmergencyAlerts: boolean
    alertAllMembers: boolean
    cascadeToParentGroups: boolean
    requireConfirmation: boolean
    autoEscalate: boolean
  }
}

export interface GroupPermissions {
  canCreateSubGroups: boolean
  canInviteMembers: boolean
  canRemoveMembers: boolean
  canModifySettings: boolean
  canSendBroadcasts: boolean
  canViewAnalytics: boolean
  canManageEmergencyConfig: boolean
  canAccessMemberData: boolean
}

export interface OrganizationRole {
  id: string
  organizationId: string
  name: string
  description?: string
  level: 'user' | 'manager' | 'admin' | 'owner'
  
  // Permissions
  permissions: {
    users: string[] // create, read, update, delete, invite
    groups: string[] // create, read, update, delete, join, moderate
    settings: string[] // view, modify, security, billing
    emergency: string[] // respond, escalate, coordinate, override
    data: string[] // view, export, audit, delete
    organization: string[] // manage, settings, billing, delete
  }
  
  // Limits
  limits: {
    maxUsersManaged?: number
    maxGroupsManaged?: number
    canCreateGroups: boolean
    canInviteUsers: boolean
    canAccessBilling: boolean
  }
  
  isSystemRole: boolean
  createdAt: string
  updatedAt: string
}

export interface OrganizationInvitation {
  id: string
  organizationId: string
  email: string
  role: string
  groupIds?: string[]
  
  // Invitation details
  invitedBy: string
  message?: string
  expiresAt: string
  
  // Status
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled'
  
  // Response
  respondedAt?: string
  response?: {
    accepted: boolean
    message?: string
  }
  
  createdAt: string
}

export interface OrganizationAnalytics {
  organizationId: string
  period: 'day' | 'week' | 'month' | 'quarter' | 'year'
  startDate: string
  endDate: string
  
  // User metrics
  users: {
    total: number
    active: number
    new: number
    churn: number
    averageSessionDuration: number
    loginFrequency: number
  }
  
  // Group metrics
  groups: {
    total: number
    active: number
    averageSize: number
    messagingActivity: number
    emergencyGroups: number
  }
  
  // Emergency response metrics
  emergencyResponse: {
    totalAlerts: number
    responseTime: {
      average: number
      median: number
      fastest: number
      slowest: number
    }
    escalationRate: number
    resolutionRate: number
    falseAlarmRate: number
  }
  
  // Communication metrics
  communication: {
    totalMessages: number
    broadcastsSent: number
    filesShared: number
    averageResponseTime: number
  }
  
  // Security metrics
  security: {
    loginAttempts: number
    failedLogins: number
    suspiciousActivities: number
    dataAccessEvents: number
    complianceViolations: number
  }
  
  // Usage patterns
  usage: {
    peakHours: string[]
    mostActiveGroups: string[]
    featureUsage: Record<string, number>
    geographicDistribution: Record<string, number>
  }
}

export interface BulkOperation {
  id: string
  organizationId: string
  type: 'user_invite' | 'user_remove' | 'group_create' | 'role_assign' | 'data_export' | 'settings_update'
  
  // Operation details
  description: string
  targets: string[] // User IDs, emails, or other identifiers
  parameters: Record<string, any>
  
  // Progress
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: {
    total: number
    completed: number
    failed: number
    errors: string[]
  }
  
  // Results
  results?: {
    successful: string[]
    failed: Array<{ target: string; error: string }>
    summary: string
  }
  
  // Timestamps
  createdAt: string
  startedAt?: string
  completedAt?: string
  createdBy: string
}

export class OrganizationService {
  private static instance: OrganizationService
  private organizations: Map<string, Organization> = new Map()
  private groups: Map<string, OrganizationGroup> = new Map()
  private roles: Map<string, OrganizationRole> = new Map()
  private invitations: Map<string, OrganizationInvitation> = new Map()
  private analytics: Map<string, OrganizationAnalytics> = new Map()
  private bulkOperations: Map<string, BulkOperation> = new Map()
  private eventCallbacks: Map<string, Function[]> = new Map()

  private constructor() {
    this.loadData()
    this.initializeSystemRoles()
  }

  static getInstance(): OrganizationService {
    if (!OrganizationService.instance) {
      OrganizationService.instance = new OrganizationService()
    }
    return OrganizationService.instance
  }

  private loadData(): void {
    try {
      // Load organizations
      const savedOrgs = localStorage.getItem('emergencize-organizations')
      if (savedOrgs) {
        const orgsArray: Organization[] = JSON.parse(savedOrgs)
        orgsArray.forEach(org => {
          this.organizations.set(org.id, org)
        })
      }

      // Load groups
      const savedGroups = localStorage.getItem('emergencize-org-groups')
      if (savedGroups) {
        const groupsArray: OrganizationGroup[] = JSON.parse(savedGroups)
        groupsArray.forEach(group => {
          this.groups.set(group.id, group)
        })
      }

      // Load roles
      const savedRoles = localStorage.getItem('emergencize-org-roles')
      if (savedRoles) {
        const rolesArray: OrganizationRole[] = JSON.parse(savedRoles)
        rolesArray.forEach(role => {
          this.roles.set(role.id, role)
        })
      }

      // Load invitations
      const savedInvitations = localStorage.getItem('emergencize-org-invitations')
      if (savedInvitations) {
        const invitationsArray: OrganizationInvitation[] = JSON.parse(savedInvitations)
        invitationsArray.forEach(invitation => {
          this.invitations.set(invitation.id, invitation)
        })
      }
    } catch (error) {
      console.error('Error loading organization data:', error)
    }
  }

  private saveData(): void {
    try {
      // Save organizations
      const orgsArray = Array.from(this.organizations.values())
      localStorage.setItem('emergencize-organizations', JSON.stringify(orgsArray))

      // Save groups
      const groupsArray = Array.from(this.groups.values())
      localStorage.setItem('emergencize-org-groups', JSON.stringify(groupsArray))

      // Save roles
      const rolesArray = Array.from(this.roles.values())
      localStorage.setItem('emergencize-org-roles', JSON.stringify(rolesArray))

      // Save invitations (keep only last 1000)
      const invitationsArray = Array.from(this.invitations.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 1000)
      localStorage.setItem('emergencize-org-invitations', JSON.stringify(invitationsArray))
    } catch (error) {
      console.error('Error saving organization data:', error)
    }
  }

  private initializeSystemRoles(): void {
    // Create default system roles for organizations
    const systemRoles = [
      {
        name: 'Owner',
        level: 'owner' as const,
        permissions: {
          users: ['create', 'read', 'update', 'delete', 'invite'],
          groups: ['create', 'read', 'update', 'delete', 'join', 'moderate'],
          settings: ['view', 'modify', 'security', 'billing'],
          emergency: ['respond', 'escalate', 'coordinate', 'override'],
          data: ['view', 'export', 'audit', 'delete'],
          organization: ['manage', 'settings', 'billing', 'delete']
        },
        limits: {
          canCreateGroups: true,
          canInviteUsers: true,
          canAccessBilling: true
        }
      },
      {
        name: 'Administrator',
        level: 'admin' as const,
        permissions: {
          users: ['create', 'read', 'update', 'invite'],
          groups: ['create', 'read', 'update', 'delete', 'join', 'moderate'],
          settings: ['view', 'modify'],
          emergency: ['respond', 'escalate', 'coordinate'],
          data: ['view', 'export', 'audit'],
          organization: ['manage', 'settings']
        },
        limits: {
          canCreateGroups: true,
          canInviteUsers: true,
          canAccessBilling: false
        }
      },
      {
        name: 'Manager',
        level: 'manager' as const,
        permissions: {
          users: ['read', 'invite'],
          groups: ['create', 'read', 'update', 'join', 'moderate'],
          settings: ['view'],
          emergency: ['respond', 'escalate'],
          data: ['view'],
          organization: []
        },
        limits: {
          maxUsersManaged: 50,
          maxGroupsManaged: 10,
          canCreateGroups: true,
          canInviteUsers: true,
          canAccessBilling: false
        }
      },
      {
        name: 'Member',
        level: 'user' as const,
        permissions: {
          users: ['read'],
          groups: ['read', 'join'],
          settings: [],
          emergency: ['respond'],
          data: [],
          organization: []
        },
        limits: {
          canCreateGroups: false,
          canInviteUsers: false,
          canAccessBilling: false
        }
      }
    ]

    systemRoles.forEach(roleConfig => {
      const roleId = `system_role_${roleConfig.level}`
      if (!this.roles.has(roleId)) {
        const role: OrganizationRole = {
          id: roleId,
          organizationId: 'system',
          name: roleConfig.name,
          description: `Default ${roleConfig.name} role with standard permissions`,
          level: roleConfig.level,
          permissions: roleConfig.permissions,
          limits: roleConfig.limits,
          isSystemRole: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        this.roles.set(roleId, role)
      }
    })
  }

  async createOrganization(config: {
    name: string
    type: Organization['type']
    description?: string
    industry?: string
    size: Organization['size']
    contactInfo: Organization['contactInfo']
    createdBy: string
  }): Promise<Organization | null> {
    try {
      // Check rate limiting
      const canCreate = await RateLimitService.getInstance().checkRateLimit(
        config.createdBy,
        'organization_creation',
        3, // 3 organizations per month
        30 * 24 * 60 * 60 * 1000
      )

      if (!canCreate) {
        throw new Error('Rate limit exceeded for organization creation')
      }

      const orgId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date().toISOString()

      // Default settings based on organization type and size
      const defaultSettings = this.getDefaultSettings(config.type, config.size)
      const subscription = this.getDefaultSubscription(config.size)

      const organization: Organization = {
        id: orgId,
        name: config.name,
        type: config.type,
        description: config.description,
        industry: config.industry,
        size: config.size,
        contactInfo: config.contactInfo,
        settings: defaultSettings,
        subscription,
        status: 'trial',
        isVerified: false,
        createdAt: now,
        updatedAt: now,
        createdBy: config.createdBy
      }

      // Validate organization
      const validation = this.validateOrganization(organization)
      if (!validation.isValid) {
        throw new Error(`Organization validation failed: ${validation.errors.join(', ')}`)
      }

      this.organizations.set(orgId, organization)

      // Create default groups
      await this.createDefaultGroups(organization)

      // Create organization-specific roles
      await this.createOrganizationRoles(organization)

      this.saveData()

      SecurityMonitoringService.getInstance().logSecurityEvent({
        type: 'organization_created',
        severity: 'medium',
        details: {
          organizationId: orgId,
          organizationName: organization.name,
          organizationType: organization.type,
          organizationSize: organization.size
        },
        userId: config.createdBy,
        timestamp: new Date(),
        riskScore: 20
      })

      console.log('Organization created:', organization.name)
      this.emit('organizationCreated', organization)
      
      return organization
    } catch (error) {
      console.error('Failed to create organization:', error)
      return null
    }
  }

  async createGroup(config: {
    organizationId: string
    name: string
    description?: string
    type: OrganizationGroup['type']
    parentGroupId?: string
    settings?: Partial<GroupSettings>
    emergencyConfig?: Partial<OrganizationGroup['emergencyConfig']>
    createdBy: string
  }): Promise<OrganizationGroup | null> {
    try {
      const organization = this.organizations.get(config.organizationId)
      if (!organization) {
        throw new Error('Organization not found')
      }

      // Check permissions and limits
      const canCreate = await this.checkGroupCreationPermissions(organization, config.createdBy)
      if (!canCreate) {
        throw new Error('Insufficient permissions to create group')
      }

      const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date().toISOString()

      // Calculate group level
      let level = 0
      if (config.parentGroupId) {
        const parentGroup = this.groups.get(config.parentGroupId)
        if (parentGroup) {
          level = parentGroup.level + 1
        }
      }

      const defaultSettings: GroupSettings = {
        privacy: organization.settings.groups.defaultGroupPrivacy,
        allowMemberInvites: true,
        requireApprovalToJoin: false,
        allowMemberExit: true,
        communication: {
          allowMessages: true,
          allowFileSharing: organization.settings.communication.allowFileSharing,
          moderateMessages: organization.settings.communication.moderateGroupMessages,
          allowBroadcast: false
        },
        location: {
          allowLocationSharing: organization.settings.privacy.allowMemberLocationSharing,
          trackMemberLocations: false,
          geofenceEnabled: false,
          locationUpdateInterval: 300000 // 5 minutes
        },
        alerts: {
          allowEmergencyAlerts: true,
          alertAllMembers: true,
          cascadeToParentGroups: true,
          requireConfirmation: false,
          autoEscalate: false
        }
      }

      const defaultEmergencyConfig: OrganizationGroup['emergencyConfig'] = {
        isEmergencyGroup: false,
        escalationChain: [],
        emergencyContacts: [],
        alertTypes: []
      }

      const defaultPermissions: GroupPermissions = {
        canCreateSubGroups: level < 3, // Max 3 levels deep
        canInviteMembers: true,
        canRemoveMembers: false,
        canModifySettings: false,
        canSendBroadcasts: false,
        canViewAnalytics: false,
        canManageEmergencyConfig: false,
        canAccessMemberData: false
      }

      const group: OrganizationGroup = {
        id: groupId,
        organizationId: config.organizationId,
        name: config.name,
        description: config.description,
        type: config.type,
        parentGroupId: config.parentGroupId,
        childGroups: [],
        level,
        members: [
          {
            userId: config.createdBy,
            role: 'owner',
            permissions: Object.keys(defaultPermissions),
            joinedAt: now,
            status: 'active'
          }
        ],
        settings: { ...defaultSettings, ...config.settings },
        emergencyConfig: { ...defaultEmergencyConfig, ...config.emergencyConfig },
        permissions: defaultPermissions,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        createdBy: config.createdBy
      }

      this.groups.set(groupId, group)

      // Update parent group if specified
      if (config.parentGroupId) {
        const parentGroup = this.groups.get(config.parentGroupId)
        if (parentGroup) {
          parentGroup.childGroups.push(groupId)
          parentGroup.updatedAt = now
          this.groups.set(config.parentGroupId, parentGroup)
        }
      }

      this.saveData()

      SecurityMonitoringService.getInstance().logSecurityEvent({
        type: 'organization_group_created',
        severity: 'low',
        details: {
          organizationId: config.organizationId,
          groupId,
          groupName: group.name,
          groupType: group.type,
          parentGroupId: config.parentGroupId,
          level
        },
        userId: config.createdBy,
        timestamp: new Date(),
        riskScore: 10
      })

      console.log('Organization group created:', group.name)
      this.emit('groupCreated', group)
      
      return group
    } catch (error) {
      console.error('Failed to create organization group:', error)
      return null
    }
  }

  async inviteUsers(config: {
    organizationId: string
    emails: string[]
    role: string
    groupIds?: string[]
    message?: string
    invitedBy: string
  }): Promise<OrganizationInvitation[]> {
    const invitations: OrganizationInvitation[] = []

    try {
      const organization = this.organizations.get(config.organizationId)
      if (!organization) {
        throw new Error('Organization not found')
      }

      // Check permissions
      const canInvite = await this.checkInvitePermissions(organization, config.invitedBy)
      if (!canInvite) {
        throw new Error('Insufficient permissions to invite users')
      }

      // Check subscription limits
      const currentUserCount = this.getOrganizationUserCount(config.organizationId)
      if (currentUserCount + config.emails.length > organization.subscription.maxUsers) {
        throw new Error('Would exceed maximum user limit for subscription')
      }

      for (const email of config.emails) {
        try {
          // Validate email
          const emailValidation = ValidationService.getInstance().validateUserProfile({ email })
          if (!emailValidation.isValid) {
            continue
          }

          // Check for existing invitation
          const existingInvitation = Array.from(this.invitations.values())
            .find(inv => inv.organizationId === config.organizationId && 
                        inv.email === email && 
                        inv.status === 'pending')

          if (existingInvitation) {
            continue // Skip duplicate invitation
          }

          const invitationId = `invitation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          const expiresAt = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)) // 7 days

          const invitation: OrganizationInvitation = {
            id: invitationId,
            organizationId: config.organizationId,
            email,
            role: config.role,
            groupIds: config.groupIds,
            invitedBy: config.invitedBy,
            message: config.message,
            expiresAt: expiresAt.toISOString(),
            status: 'pending',
            createdAt: new Date().toISOString()
          }

          this.invitations.set(invitationId, invitation)
          invitations.push(invitation)

          // Send invitation email (placeholder)
          await this.sendInvitationEmail(invitation, organization)

        } catch (error) {
          console.error(`Failed to create invitation for ${email}:`, error)
        }
      }

      this.saveData()

      SecurityMonitoringService.getInstance().logSecurityEvent({
        type: 'organization_users_invited',
        severity: 'medium',
        details: {
          organizationId: config.organizationId,
          invitedCount: invitations.length,
          role: config.role,
          groupIds: config.groupIds
        },
        userId: config.invitedBy,
        timestamp: new Date(),
        riskScore: 15
      })

      console.log(`Sent ${invitations.length} organization invitations`)
      this.emit('usersInvited', { invitations, organizationId: config.organizationId })
      
      return invitations
    } catch (error) {
      console.error('Failed to invite users:', error)
      return invitations
    }
  }

  async generateAnalytics(organizationId: string, period: OrganizationAnalytics['period']): Promise<OrganizationAnalytics | null> {
    try {
      const organization = this.organizations.get(organizationId)
      if (!organization) {
        throw new Error('Organization not found')
      }

      const now = new Date()
      let startDate: Date
      let endDate = now

      // Calculate date range based on period
      switch (period) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }

      // Generate analytics data (in a real implementation, this would query actual data)
      const analytics: OrganizationAnalytics = {
        organizationId,
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        
        users: {
          total: this.getOrganizationUserCount(organizationId),
          active: Math.floor(this.getOrganizationUserCount(organizationId) * 0.8),
          new: Math.floor(Math.random() * 10),
          churn: Math.floor(Math.random() * 5),
          averageSessionDuration: 45 + Math.random() * 30, // minutes
          loginFrequency: 2.5 + Math.random() * 2 // times per day
        },
        
        groups: {
          total: this.getOrganizationGroups(organizationId).length,
          active: Math.floor(this.getOrganizationGroups(organizationId).length * 0.9),
          averageSize: this.calculateAverageGroupSize(organizationId),
          messagingActivity: Math.floor(Math.random() * 1000),
          emergencyGroups: this.getEmergencyGroups(organizationId).length
        },
        
        emergencyResponse: {
          totalAlerts: Math.floor(Math.random() * 50),
          responseTime: {
            average: 8.5 + Math.random() * 10,
            median: 6.2 + Math.random() * 8,
            fastest: 1.1 + Math.random() * 2,
            slowest: 25 + Math.random() * 15
          },
          escalationRate: 0.15 + Math.random() * 0.1,
          resolutionRate: 0.95 + Math.random() * 0.05,
          falseAlarmRate: 0.05 + Math.random() * 0.1
        },
        
        communication: {
          totalMessages: Math.floor(Math.random() * 5000),
          broadcastsSent: Math.floor(Math.random() * 20),
          filesShared: Math.floor(Math.random() * 200),
          averageResponseTime: 5 + Math.random() * 10 // minutes
        },
        
        security: {
          loginAttempts: Math.floor(Math.random() * 1000),
          failedLogins: Math.floor(Math.random() * 50),
          suspiciousActivities: Math.floor(Math.random() * 10),
          dataAccessEvents: Math.floor(Math.random() * 500),
          complianceViolations: Math.floor(Math.random() * 3)
        },
        
        usage: {
          peakHours: ['09:00', '10:00', '14:00', '15:00'],
          mostActiveGroups: this.getOrganizationGroups(organizationId)
            .slice(0, 5)
            .map(g => g.id),
          featureUsage: {
            'emergency_alerts': Math.floor(Math.random() * 100),
            'group_messaging': Math.floor(Math.random() * 500),
            'location_sharing': Math.floor(Math.random() * 200),
            'file_sharing': Math.floor(Math.random() * 150)
          },
          geographicDistribution: {
            'North America': 45 + Math.random() * 20,
            'Europe': 25 + Math.random() * 15,
            'Asia': 20 + Math.random() * 15,
            'Other': 10 + Math.random() * 10
          }
        }
      }

      this.analytics.set(`${organizationId}_${period}`, analytics)
      
      console.log(`Generated analytics for organization ${organizationId}`)
      this.emit('analyticsGenerated', analytics)
      
      return analytics
    } catch (error) {
      console.error('Failed to generate analytics:', error)
      return null
    }
  }

  // Helper methods
  private getDefaultSettings(type: Organization['type'], size: Organization['size']): OrganizationSettings {
    // Return appropriate settings based on organization type and size
    const baseSettings: OrganizationSettings = {
      emergencyResponse: {
        autoEscalationEnabled: true,
        escalationTimeoutMinutes: 15,
        requireManagerApproval: size === 'enterprise',
        emergencyContactRequired: true,
        locationTrackingRequired: type === 'healthcare' || type === 'government'
      },
      privacy: {
        allowMemberLocationSharing: true,
        defaultLocationPrecision: type === 'healthcare' ? 'precise' : 'approximate',
        dataRetentionDays: type === 'healthcare' ? 2555 : 365, // 7 years for healthcare
        allowDataExport: true,
        requireConsentForSharing: true
      },
      communication: {
        allowDirectMessaging: true,
        moderateGroupMessages: size === 'large' || size === 'enterprise',
        allowFileSharing: true,
        maxFileSize: size === 'enterprise' ? 100 : size === 'large' ? 50 : 25,
        allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png', 'txt']
      },
      security: {
        requireTwoFactor: size === 'enterprise' || type === 'healthcare',
        passwordPolicy: {
          minLength: 8,
          requireSpecialChars: true,
          requireNumbers: true,
          expirationDays: type === 'healthcare' ? 90 : undefined
        },
        sessionTimeoutMinutes: 480 // 8 hours
      },
      groups: {
        allowMemberCreateGroups: size !== 'enterprise',
        requireApprovalForGroups: size === 'large' || size === 'enterprise',
        maxGroupSize: size === 'enterprise' ? 1000 : size === 'large' ? 500 : 100,
        allowNestedGroups: true,
        defaultGroupPrivacy: 'private'
      },
      audit: {
        logAllActivities: type === 'healthcare' || type === 'government',
        retainLogsForDays: type === 'healthcare' ? 2555 : 365,
        allowMemberDataAccess: false,
        complianceStandards: type === 'healthcare' ? ['HIPAA'] : []
      }
    }

    return baseSettings
  }

  private getDefaultSubscription(size: Organization['size']): Organization['subscription'] {
    switch (size) {
      case 'small':
        return {
          plan: 'basic',
          maxUsers: 25,
          maxGroups: 10,
          features: ['basic_alerts', 'group_messaging', 'basic_analytics']
        }
      case 'medium':
        return {
          plan: 'professional',
          maxUsers: 100,
          maxGroups: 50,
          features: ['advanced_alerts', 'group_messaging', 'advanced_analytics', 'api_access']
        }
      case 'large':
        return {
          plan: 'professional',
          maxUsers: 500,
          maxGroups: 200,
          features: ['advanced_alerts', 'group_messaging', 'advanced_analytics', 'api_access', 'sso']
        }
      case 'enterprise':
        return {
          plan: 'enterprise',
          maxUsers: 10000,
          maxGroups: 1000,
          features: ['enterprise_alerts', 'group_messaging', 'enterprise_analytics', 'api_access', 'sso', 'compliance']
        }
      default:
        return {
          plan: 'free',
          maxUsers: 10,
          maxGroups: 3,
          features: ['basic_alerts']
        }
    }
  }

  private async createDefaultGroups(organization: Organization): Promise<void> {
    // Create default groups based on organization type
    const defaultGroups = []

    switch (organization.type) {
      case 'business':
        defaultGroups.push(
          { name: 'All Staff', type: 'department' as const },
          { name: 'Management', type: 'department' as const },
          { name: 'Emergency Response Team', type: 'emergency_response' as const }
        )
        break
      case 'school':
        defaultGroups.push(
          { name: 'Faculty', type: 'department' as const },
          { name: 'Students', type: 'department' as const },
          { name: 'Emergency Team', type: 'emergency_response' as const }
        )
        break
      case 'healthcare':
        defaultGroups.push(
          { name: 'Medical Staff', type: 'department' as const },
          { name: 'Emergency Response', type: 'emergency_response' as const },
          { name: 'Administration', type: 'department' as const }
        )
        break
      default:
        defaultGroups.push(
          { name: 'General', type: 'custom' as const },
          { name: 'Emergency Team', type: 'emergency_response' as const }
        )
    }

    for (const groupConfig of defaultGroups) {
      await this.createGroup({
        organizationId: organization.id,
        name: groupConfig.name,
        type: groupConfig.type,
        createdBy: organization.createdBy
      })
    }
  }

  private async createOrganizationRoles(organization: Organization): Promise<void> {
    // Copy system roles and customize for this organization
    const systemRoles = Array.from(this.roles.values()).filter(role => role.isSystemRole)
    
    for (const systemRole of systemRoles) {
      const roleId = `${organization.id}_${systemRole.level}`
      const customRole: OrganizationRole = {
        ...systemRole,
        id: roleId,
        organizationId: organization.id,
        isSystemRole: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      this.roles.set(roleId, customRole)
    }
  }

  private validateOrganization(organization: Organization): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!organization.name || organization.name.trim().length < 2) {
      errors.push('Organization name must be at least 2 characters')
    }

    if (!organization.contactInfo.email) {
      errors.push('Contact email is required')
    }

    if (!organization.createdBy) {
      errors.push('Creator user ID is required')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  private async checkGroupCreationPermissions(organization: Organization, userId: string): Promise<boolean> {
    // Check if user has permission to create groups
    return organization.settings.groups.allowMemberCreateGroups
  }

  private async checkInvitePermissions(organization: Organization, userId: string): Promise<boolean> {
    // Check if user has permission to invite others
    return true // Simplified for demo
  }

  private getOrganizationUserCount(organizationId: string): number {
    // In a real implementation, this would query the actual user count
    return Math.floor(Math.random() * 100) + 10
  }

  private getOrganizationGroups(organizationId: string): OrganizationGroup[] {
    return Array.from(this.groups.values()).filter(group => group.organizationId === organizationId)
  }

  private getEmergencyGroups(organizationId: string): OrganizationGroup[] {
    return this.getOrganizationGroups(organizationId).filter(group => group.emergencyConfig.isEmergencyGroup)
  }

  private calculateAverageGroupSize(organizationId: string): number {
    const groups = this.getOrganizationGroups(organizationId)
    if (groups.length === 0) return 0
    
    const totalMembers = groups.reduce((sum, group) => sum + group.members.length, 0)
    return totalMembers / groups.length
  }

  private async sendInvitationEmail(invitation: OrganizationInvitation, organization: Organization): Promise<void> {
    // Placeholder for email sending
    console.log(`Sending invitation email to ${invitation.email} for ${organization.name}`)
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, [])
    }
    this.eventCallbacks.get(event)!.push(callback)
  }

  off(event: string, callback: Function): void {
    const callbacks = this.eventCallbacks.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.eventCallbacks.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in event callback:', error)
        }
      })
    }
  }

  // Public API methods
  getOrganizations(): Organization[] {
    return Array.from(this.organizations.values())
  }

  getOrganization(organizationId: string): Organization | null {
    return this.organizations.get(organizationId) || null
  }

  getGroups(organizationId?: string): OrganizationGroup[] {
    const groups = Array.from(this.groups.values())
    return organizationId ? groups.filter(g => g.organizationId === organizationId) : groups
  }

  getGroup(groupId: string): OrganizationGroup | null {
    return this.groups.get(groupId) || null
  }

  getRoles(organizationId?: string): OrganizationRole[] {
    const roles = Array.from(this.roles.values())
    return organizationId ? roles.filter(r => r.organizationId === organizationId) : roles
  }

  getInvitations(organizationId?: string): OrganizationInvitation[] {
    const invitations = Array.from(this.invitations.values())
    return organizationId ? invitations.filter(i => i.organizationId === organizationId) : invitations
  }

  // Cleanup
  destroy(): void {
    this.organizations.clear()
    this.groups.clear()
    this.roles.clear()
    this.invitations.clear()
    this.analytics.clear()
    this.bulkOperations.clear()
    this.eventCallbacks.clear()
  }
}

export default OrganizationService.getInstance()