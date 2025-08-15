import { ValidationService } from './ValidationService'
import { SecurityMonitoringService } from './SecurityMonitoringService'
import { rateLimitService } from './RateLimitService'

export interface Incident {
  id: string
  title: string
  description: string
  type: 'emergency_alert' | 'false_alarm' | 'system_failure' | 'user_error' | 'security_breach' | 'communication_failure' | 'equipment_failure' | 'natural_disaster' | 'medical_emergency' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in_progress' | 'under_review' | 'resolved' | 'closed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  
  // Incident details
  details: {
    location?: {
      lat: number
      lng: number
      address?: string
      description?: string
    }
    peopleInvolved: string[] // User IDs
    contactsNotified: string[] // Contact IDs
    emergencyServices?: {
      contacted: boolean
      services: string[] // 'police', 'fire', 'medical', 'other'
      responseTime?: number // minutes
      incidentNumber?: string
    }
    timelineEvents: IncidentTimelineEvent[]
  }
  
  // Reporting information
  reporting: {
    reportedBy: string // User ID
    reportedAt: string
    reportingMethod: 'app' | 'call' | 'email' | 'in_person' | 'automatic' | 'external'
    initialAlertId?: string // If originated from an emergency alert
    organizationId?: string
    groupId?: string
  }
  
  // Impact assessment
  impact: {
    peopleAffected: number
    businessImpact: 'none' | 'minimal' | 'moderate' | 'significant' | 'severe'
    financialImpact?: {
      estimated: number
      currency: string
      breakdown?: string
    }
    reputationalImpact: 'none' | 'minimal' | 'moderate' | 'significant' | 'severe'
    operationalImpact: 'none' | 'minimal' | 'moderate' | 'significant' | 'severe'
  }
  
  // Resolution tracking
  resolution: {
    assignedTo?: string // User ID
    assignedAt?: string
    resolvedBy?: string // User ID
    resolvedAt?: string
    resolutionMethod?: 'automated' | 'manual_fix' | 'escalation' | 'external_help' | 'false_alarm' | 'other'
    resolutionSummary?: string
    preventionMeasures?: string
    followUpRequired: boolean
    followUpTasks: FollowUpTask[]
  }
  
  // Evidence and documentation
  evidence: {
    photos: IncidentPhoto[]
    documents: IncidentDocument[]
    audioRecordings: IncidentAudio[]
    videoRecordings: IncidentVideo[]
    logs: IncidentLog[]
    witness_statements: WitnessStatement[]
  }
  
  // Metadata
  metadata: {
    tags: string[]
    customFields: Record<string, any>
    relatedIncidents: string[] // Incident IDs
    externalReferences: ExternalReference[]
  }
  
  // Timestamps
  occurredAt: string
  discoveredAt: string
  createdAt: string
  updatedAt: string
  closedAt?: string
}

export interface IncidentTimelineEvent {
  id: string
  timestamp: string
  type: 'incident_start' | 'alert_sent' | 'response_initiated' | 'emergency_services_contacted' | 'on_scene_arrival' | 'status_update' | 'escalation' | 'resolution_started' | 'incident_resolved' | 'custom'
  description: string
  performedBy?: string // User ID
  automated: boolean
  severity?: 'low' | 'medium' | 'high' | 'critical'
  attachments?: string[] // Attachment IDs
  location?: {
    lat: number
    lng: number
    address?: string
  }
}

export interface FollowUpTask {
  id: string
  title: string
  description: string
  assignedTo?: string // User ID
  dueDate?: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  completedAt?: string
  completedBy?: string // User ID
  notes?: string
}

export interface IncidentPhoto {
  id: string
  url: string
  thumbnail: string
  filename: string
  size: number
  mimeType: string
  uploadedBy: string // User ID
  uploadedAt: string
  location?: {
    lat: number
    lng: number
  }
  description?: string
  metadata?: {
    camera?: string
    timestamp?: string
    gps?: {
      lat: number
      lng: number
      altitude?: number
    }
  }
}

export interface IncidentDocument {
  id: string
  url: string
  filename: string
  size: number
  mimeType: string
  type: 'report' | 'form' | 'legal' | 'medical' | 'insurance' | 'compliance' | 'other'
  uploadedBy: string // User ID
  uploadedAt: string
  description?: string
  version: number
  isConfidential: boolean
}

export interface IncidentAudio {
  id: string
  url: string
  filename: string
  duration: number // seconds
  size: number
  mimeType: string
  type: 'emergency_call' | 'voice_note' | 'interview' | 'other'
  recordedBy?: string // User ID
  recordedAt: string
  uploadedBy: string // User ID
  uploadedAt: string
  transcription?: string
  description?: string
}

export interface IncidentVideo {
  id: string
  url: string
  thumbnail: string
  filename: string
  duration: number // seconds
  size: number
  mimeType: string
  type: 'security_footage' | 'phone_recording' | 'body_cam' | 'drone_footage' | 'other'
  recordedBy?: string // User ID
  recordedAt: string
  uploadedBy: string // User ID
  uploadedAt: string
  description?: string
  metadata?: {
    resolution?: string
    fps?: number
    location?: {
      lat: number
      lng: number
    }
  }
}

export interface IncidentLog {
  id: string
  source: 'system' | 'application' | 'device' | 'service' | 'manual'
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical'
  message: string
  timestamp: string
  metadata?: Record<string, any>
  userId?: string
  ipAddress?: string
  userAgent?: string
}

export interface WitnessStatement {
  id: string
  witnessName: string
  witnessContact?: string
  witnessRole?: string // 'employee', 'visitor', 'resident', 'bystander'
  statement: string
  statementType: 'written' | 'verbal' | 'recorded'
  recordedBy: string // User ID
  recordedAt: string
  isVerified: boolean
  verifiedBy?: string // User ID
  verifiedAt?: string
  attachments?: string[] // Attachment IDs
}

export interface ExternalReference {
  type: 'police_report' | 'fire_report' | 'medical_report' | 'insurance_claim' | 'regulatory_filing' | 'news_article' | 'other'
  referenceNumber?: string
  url?: string
  description: string
  contactInfo?: string
  date?: string
}

export interface IncidentReport {
  id: string
  incidentId: string
  type: 'preliminary' | 'detailed' | 'final' | 'executive_summary' | 'regulatory' | 'insurance' | 'custom'
  title: string
  description?: string
  
  // Report content
  content: {
    summary: string
    detailedDescription: string
    timeline: string
    causeAnalysis: string
    impactAssessment: string
    responseActions: string
    lessonsLearned: string
    recommendations: string
    preventionMeasures: string
  }
  
  // Report metadata
  metadata: {
    generatedBy: string // User ID
    generatedAt: string
    approvedBy?: string // User ID
    approvedAt?: string
    version: number
    status: 'draft' | 'under_review' | 'approved' | 'published' | 'archived'
    confidentialityLevel: 'public' | 'internal' | 'confidential' | 'restricted'
    audience: string[] // 'management', 'employees', 'regulators', 'insurance', 'public'
  }
  
  // Distribution
  distribution: {
    sendTo: string[] // Email addresses or user IDs
    sentAt?: string
    deliveryStatus: Record<string, 'pending' | 'sent' | 'delivered' | 'failed'>
  }
  
  // Attachments
  attachments: string[] // Attachment IDs
  
  createdAt: string
  updatedAt: string
}

export interface IncidentMetrics {
  period: 'day' | 'week' | 'month' | 'quarter' | 'year'
  startDate: string
  endDate: string
  
  // Volume metrics
  totalIncidents: number
  incidentsByType: Record<Incident['type'], number>
  incidentsBySeverity: Record<Incident['severity'], number>
  incidentsByStatus: Record<Incident['status'], number>
  
  // Response metrics
  averageResponseTime: number // minutes
  medianResponseTime: number // minutes
  averageResolutionTime: number // minutes
  medianResolutionTime: number // minutes
  
  // Quality metrics
  falseAlarmRate: number // percentage
  escalationRate: number // percentage
  reopenRate: number // percentage
  customerSatisfactionScore?: number // 1-5 scale
  
  // Trends
  incidentTrend: {
    current: number
    previous: number
    changePercent: number
  }
  
  // Top categories
  topIncidentTypes: Array<{
    type: Incident['type']
    count: number
    percentage: number
  }>
  
  topLocations: Array<{
    location: string
    count: number
    percentage: number
  }>
  
  // Performance indicators
  slaCompliance: {
    responseTime: number // percentage
    resolutionTime: number // percentage
  }
}

export class IncidentReportingService {
  private static instance: IncidentReportingService
  private incidents: Map<string, Incident> = new Map()
  private reports: Map<string, IncidentReport> = new Map()
  private eventCallbacks: Map<string, Function[]> = new Map()

  private constructor() {
    this.loadData()
  }

  static getInstance(): IncidentReportingService {
    if (!IncidentReportingService.instance) {
      IncidentReportingService.instance = new IncidentReportingService()
    }
    return IncidentReportingService.instance
  }

  private loadData(): void {
    try {
      // Load incidents
      const savedIncidents = localStorage.getItem('emergencize-incidents')
      if (savedIncidents) {
        const incidentsArray: Incident[] = JSON.parse(savedIncidents)
        incidentsArray.forEach(incident => {
          this.incidents.set(incident.id, incident)
        })
      }

      // Load reports
      const savedReports = localStorage.getItem('emergencize-incident-reports')
      if (savedReports) {
        const reportsArray: IncidentReport[] = JSON.parse(savedReports)
        reportsArray.forEach(report => {
          this.reports.set(report.id, report)
        })
      }
    } catch (error) {
      console.error('Error loading incident data:', error)
    }
  }

  private saveData(): void {
    try {
      // Save incidents (keep only last 1000)
      const incidentsArray = Array.from(this.incidents.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 1000)
      localStorage.setItem('emergencize-incidents', JSON.stringify(incidentsArray))

      // Save reports (keep only last 500)
      const reportsArray = Array.from(this.reports.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 500)
      localStorage.setItem('emergencize-incident-reports', JSON.stringify(reportsArray))
    } catch (error) {
      console.error('Error saving incident data:', error)
    }
  }

  async createIncident(config: {
    title: string
    description: string
    type: Incident['type']
    severity: Incident['severity']
    priority?: Incident['priority']
    location?: Incident['details']['location']
    peopleInvolved?: string[]
    reportedBy: string
    reportingMethod?: Incident['reporting']['reportingMethod']
    initialAlertId?: string
    organizationId?: string
    groupId?: string
    occurredAt?: string
    discoveredAt?: string
  }): Promise<Incident | null> {
    try {
      // Check rate limiting
      const rateLimitResult = await rateLimitService.checkRateLimit(
        config.reportedBy,
        'incident_creation'
      )

      if (!rateLimitResult.allowed) {
        throw new Error('Rate limit exceeded for incident creation')
      }

      const incidentId = `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date().toISOString()

      const incident: Incident = {
        id: incidentId,
        title: config.title,
        description: config.description,
        type: config.type,
        severity: config.severity,
        status: 'open',
        priority: config.priority || this.calculatePriority(config.severity, config.type),
        
        details: {
          location: config.location,
          peopleInvolved: config.peopleInvolved || [],
          contactsNotified: [],
          timelineEvents: [
            {
              id: `timeline_${Date.now()}`,
              timestamp: config.occurredAt || now,
              type: 'incident_start',
              description: 'Incident occurred',
              automated: false
            },
            {
              id: `timeline_${Date.now() + 1}`,
              timestamp: config.discoveredAt || now,
              type: 'custom',
              description: 'Incident discovered and reported',
              performedBy: config.reportedBy,
              automated: false
            }
          ]
        },
        
        reporting: {
          reportedBy: config.reportedBy,
          reportedAt: now,
          reportingMethod: config.reportingMethod || 'app',
          initialAlertId: config.initialAlertId,
          organizationId: config.organizationId,
          groupId: config.groupId
        },
        
        impact: {
          peopleAffected: config.peopleInvolved?.length || 0,
          businessImpact: 'none',
          reputationalImpact: 'none',
          operationalImpact: 'none'
        },
        
        resolution: {
          followUpRequired: false,
          followUpTasks: []
        },
        
        evidence: {
          photos: [],
          documents: [],
          audioRecordings: [],
          videoRecordings: [],
          logs: [],
          witness_statements: []
        },
        
        metadata: {
          tags: [],
          customFields: {},
          relatedIncidents: [],
          externalReferences: []
        },
        
        occurredAt: config.occurredAt || now,
        discoveredAt: config.discoveredAt || now,
        createdAt: now,
        updatedAt: now
      }

      // Validate incident
      const validation = this.validateIncident(incident)
      if (!validation.isValid) {
        throw new Error(`Incident validation failed: ${validation.errors.join(', ')}`)
      }

      this.incidents.set(incidentId, incident)
      this.saveData()

      SecurityMonitoringService.getInstance().logSecurityEvent({
        type: 'suspicious_activity',
        severity: this.mapIncidentSeverityToSecuritySeverity(config.severity),
        details: {
          action: 'incident_created',
          incidentId,
          incidentType: incident.type,
          incidentSeverity: incident.severity,
          incidentTitle: incident.title,
          organizationId: config.organizationId,
          groupId: config.groupId
        },
        userId: config.reportedBy
      })

      console.log('Incident created:', incident.title)
      this.emit('incidentCreated', incident)
      
      return incident
    } catch (error) {
      console.error('Failed to create incident:', error)
      return null
    }
  }

  async updateIncident(incidentId: string, updates: Partial<Incident>): Promise<boolean> {
    try {
      const incident = this.incidents.get(incidentId)
      if (!incident) {
        throw new Error('Incident not found')
      }

      const updatedIncident: Incident = {
        ...incident,
        ...updates,
        updatedAt: new Date().toISOString()
      }

      // Validate updated incident
      const validation = this.validateIncident(updatedIncident)
      if (!validation.isValid) {
        throw new Error(`Incident validation failed: ${validation.errors.join(', ')}`)
      }

      // Add timeline event for status changes
      if (updates.status && updates.status !== incident.status) {
        const timelineEvent: IncidentTimelineEvent = {
          id: `timeline_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'status_update',
          description: `Status changed from ${incident.status} to ${updates.status}`,
          automated: false
        }
        
        if (!updatedIncident.details.timelineEvents) {
          updatedIncident.details.timelineEvents = []
        }
        updatedIncident.details.timelineEvents.push(timelineEvent)
      }

      this.incidents.set(incidentId, updatedIncident)
      this.saveData()

      console.log('Incident updated:', incidentId)
      this.emit('incidentUpdated', updatedIncident)
      
      return true
    } catch (error) {
      console.error('Failed to update incident:', error)
      return false
    }
  }

  async addTimelineEvent(incidentId: string, event: Omit<IncidentTimelineEvent, 'id'>): Promise<boolean> {
    try {
      const incident = this.incidents.get(incidentId)
      if (!incident) {
        throw new Error('Incident not found')
      }

      const timelineEvent: IncidentTimelineEvent = {
        id: `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...event
      }

      incident.details.timelineEvents.push(timelineEvent)
      incident.updatedAt = new Date().toISOString()

      this.incidents.set(incidentId, incident)
      this.saveData()

      this.emit('timelineEventAdded', { incident, event: timelineEvent })
      
      return true
    } catch (error) {
      console.error('Failed to add timeline event:', error)
      return false
    }
  }

  async resolveIncident(incidentId: string, resolution: {
    resolvedBy: string
    resolutionMethod: Incident['resolution']['resolutionMethod']
    resolutionSummary: string
    preventionMeasures?: string
    followUpRequired?: boolean
    followUpTasks?: FollowUpTask[]
  }): Promise<boolean> {
    try {
      const incident = this.incidents.get(incidentId)
      if (!incident) {
        throw new Error('Incident not found')
      }

      const now = new Date().toISOString()

      // Update incident resolution
      incident.resolution = {
        ...incident.resolution,
        resolvedBy: resolution.resolvedBy,
        resolvedAt: now,
        resolutionMethod: resolution.resolutionMethod,
        resolutionSummary: resolution.resolutionSummary,
        preventionMeasures: resolution.preventionMeasures,
        followUpRequired: resolution.followUpRequired || false,
        followUpTasks: resolution.followUpTasks || []
      }

      incident.status = 'resolved'
      incident.updatedAt = now

      // Add timeline event
      const timelineEvent: IncidentTimelineEvent = {
        id: `timeline_${Date.now()}`,
        timestamp: now,
        type: 'incident_resolved',
        description: 'Incident resolved',
        performedBy: resolution.resolvedBy,
        automated: false
      }
      incident.details.timelineEvents.push(timelineEvent)

      this.incidents.set(incidentId, incident)
      this.saveData()

      SecurityMonitoringService.getInstance().logSecurityEvent({
        type: 'authentication_success',
        severity: 'low',
        details: {
          action: 'incident_resolved',
          incidentId,
          incidentType: incident.type,
          resolutionMethod: resolution.resolutionMethod,
          resolutionTime: this.calculateResolutionTime(incident)
        },
        userId: resolution.resolvedBy
      })

      console.log('Incident resolved:', incidentId)
      this.emit('incidentResolved', incident)
      
      return true
    } catch (error) {
      console.error('Failed to resolve incident:', error)
      return false
    }
  }

  async generateReport(incidentId: string, config: {
    type: IncidentReport['type']
    title: string
    description?: string
    generatedBy: string
    audience?: string[]
    confidentialityLevel?: IncidentReport['metadata']['confidentialityLevel']
    sendTo?: string[]
  }): Promise<IncidentReport | null> {
    try {
      const incident = this.incidents.get(incidentId)
      if (!incident) {
        throw new Error('Incident not found')
      }

      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date().toISOString()

      // Generate report content based on incident data
      const content = await this.generateReportContent(incident, config.type)

      const report: IncidentReport = {
        id: reportId,
        incidentId,
        type: config.type,
        title: config.title,
        description: config.description,
        content,
        metadata: {
          generatedBy: config.generatedBy,
          generatedAt: now,
          version: 1,
          status: 'draft',
          confidentialityLevel: config.confidentialityLevel || 'internal',
          audience: config.audience || ['management']
        },
        distribution: {
          sendTo: config.sendTo || [],
          deliveryStatus: {}
        },
        attachments: [],
        createdAt: now,
        updatedAt: now
      }

      this.reports.set(reportId, report)
      this.saveData()

      console.log('Incident report generated:', reportId)
      this.emit('reportGenerated', report)
      
      return report
    } catch (error) {
      console.error('Failed to generate incident report:', error)
      return null
    }
  }

  private async generateReportContent(incident: Incident, reportType: IncidentReport['type']): Promise<IncidentReport['content']> {
    const baseContent = {
      summary: `${incident.type} incident "${incident.title}" occurred on ${new Date(incident.occurredAt).toLocaleString()}`,
      detailedDescription: incident.description,
      timeline: this.generateTimelineText(incident.details.timelineEvents),
      causeAnalysis: 'Investigation pending...',
      impactAssessment: this.generateImpactAssessmentText(incident.impact),
      responseActions: this.generateResponseActionsText(incident.details.timelineEvents),
      lessonsLearned: incident.resolution.resolutionSummary || 'To be determined',
      recommendations: incident.resolution.preventionMeasures || 'To be determined',
      preventionMeasures: incident.resolution.preventionMeasures || 'To be determined'
    }

    // Customize content based on report type
    switch (reportType) {
      case 'preliminary':
        return {
          ...baseContent,
          causeAnalysis: 'Preliminary investigation in progress',
          lessonsLearned: 'To be determined upon completion of investigation',
          recommendations: 'Preliminary recommendations to be developed'
        }
      
      case 'executive_summary':
        return {
          ...baseContent,
          summary: `Executive Summary: ${incident.severity.toUpperCase()} ${incident.type} incident with ${incident.impact.businessImpact} business impact`,
          detailedDescription: this.generateExecutiveSummary(incident)
        }
      
      case 'regulatory':
        return {
          ...baseContent,
          summary: `Regulatory Report: ${incident.type} incident requiring regulatory notification`,
          detailedDescription: this.generateRegulatoryDescription(incident)
        }
      
      default:
        return baseContent
    }
  }

  private generateTimelineText(events: IncidentTimelineEvent[]): string {
    return events
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(event => `${new Date(event.timestamp).toLocaleString()}: ${event.description}`)
      .join('\n')
  }

  private generateImpactAssessmentText(impact: Incident['impact']): string {
    const impacts = []
    if (impact.peopleAffected > 0) impacts.push(`${impact.peopleAffected} people affected`)
    impacts.push(`Business impact: ${impact.businessImpact}`)
    impacts.push(`Operational impact: ${impact.operationalImpact}`)
    impacts.push(`Reputational impact: ${impact.reputationalImpact}`)
    if (impact.financialImpact) {
      impacts.push(`Financial impact: ${impact.financialImpact.currency} ${impact.financialImpact.estimated}`)
    }
    return impacts.join('\n')
  }

  private generateResponseActionsText(events: IncidentTimelineEvent[]): string {
    const responseEvents = events.filter(event => 
      ['alert_sent', 'response_initiated', 'emergency_services_contacted', 'on_scene_arrival'].includes(event.type)
    )
    return responseEvents.length > 0
      ? responseEvents.map(event => `• ${event.description}`).join('\n')
      : 'No specific response actions recorded'
  }

  private generateExecutiveSummary(incident: Incident): string {
    return `On ${new Date(incident.occurredAt).toLocaleDateString()}, a ${incident.severity} ${incident.type} incident occurred. ` +
           `The incident has been ${incident.status} with ${incident.impact.businessImpact} business impact. ` +
           `${incident.impact.peopleAffected} people were affected. ` +
           `Response time was ${this.calculateResponseTime(incident)} minutes.`
  }

  private generateRegulatoryDescription(incident: Incident): string {
    return `This report is submitted in compliance with regulatory requirements for incident reporting. ` +
           `Incident classification: ${incident.type}, Severity: ${incident.severity}. ` +
           `All required notifications have been made and appropriate response actions taken.`
  }

  calculateMetrics(period: IncidentMetrics['period'], startDate?: string, endDate?: string): IncidentMetrics {
    const now = new Date()
    let calculatedStartDate: Date
    let calculatedEndDate = new Date(endDate || now.toISOString())

    // Calculate date range
    switch (period) {
      case 'day':
        calculatedStartDate = new Date(calculatedEndDate.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        calculatedStartDate = new Date(calculatedEndDate.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        calculatedStartDate = new Date(calculatedEndDate.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'quarter':
        calculatedStartDate = new Date(calculatedEndDate.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        calculatedStartDate = new Date(calculatedEndDate.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        calculatedStartDate = new Date(startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString())
    }

    // Filter incidents in date range
    const incidentsInRange = Array.from(this.incidents.values())
      .filter(incident => {
        const incidentDate = new Date(incident.occurredAt)
        return incidentDate >= calculatedStartDate && incidentDate <= calculatedEndDate
      })

    // Calculate metrics
    const totalIncidents = incidentsInRange.length
    
    const incidentsByType = incidentsInRange.reduce((acc, incident) => {
      acc[incident.type] = (acc[incident.type] || 0) + 1
      return acc
    }, {} as Record<Incident['type'], number>)

    const incidentsBySeverity = incidentsInRange.reduce((acc, incident) => {
      acc[incident.severity] = (acc[incident.severity] || 0) + 1
      return acc
    }, {} as Record<Incident['severity'], number>)

    const incidentsByStatus = incidentsInRange.reduce((acc, incident) => {
      acc[incident.status] = (acc[incident.status] || 0) + 1
      return acc
    }, {} as Record<Incident['status'], number>)

    // Calculate response and resolution times
    const responseTimes = incidentsInRange
      .map(incident => this.calculateResponseTime(incident))
      .filter(time => time > 0)

    const resolutionTimes = incidentsInRange
      .filter(incident => incident.status === 'resolved' || incident.status === 'closed')
      .map(incident => this.calculateResolutionTime(incident))
      .filter(time => time > 0)

    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0

    const medianResponseTime = responseTimes.length > 0
      ? this.calculateMedian(responseTimes)
      : 0

    const averageResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length
      : 0

    const medianResolutionTime = resolutionTimes.length > 0
      ? this.calculateMedian(resolutionTimes)
      : 0

    // Calculate quality metrics
    const falseAlarms = incidentsInRange.filter(incident => incident.type === 'false_alarm').length
    const falseAlarmRate = totalIncidents > 0 ? (falseAlarms / totalIncidents) * 100 : 0

    const escalatedIncidents = incidentsInRange.filter(incident =>
      incident.details.timelineEvents.some(event => event.type === 'escalation')
    ).length
    const escalationRate = totalIncidents > 0 ? (escalatedIncidents / totalIncidents) * 100 : 0

    // For demo purposes, calculate previous period for trend
    const previousPeriodStart = new Date(calculatedStartDate.getTime() - (calculatedEndDate.getTime() - calculatedStartDate.getTime()))
    const previousPeriodIncidents = Array.from(this.incidents.values())
      .filter(incident => {
        const incidentDate = new Date(incident.occurredAt)
        return incidentDate >= previousPeriodStart && incidentDate < calculatedStartDate
      }).length

    const incidentTrend = {
      current: totalIncidents,
      previous: previousPeriodIncidents,
      changePercent: previousPeriodIncidents > 0
        ? ((totalIncidents - previousPeriodIncidents) / previousPeriodIncidents) * 100
        : 0
    }

    // Top incident types
    const topIncidentTypes = Object.entries(incidentsByType)
      .map(([type, count]) => ({
        type: type as Incident['type'],
        count,
        percentage: (count / totalIncidents) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      period,
      startDate: calculatedStartDate.toISOString(),
      endDate: calculatedEndDate.toISOString(),
      totalIncidents,
      incidentsByType,
      incidentsBySeverity,
      incidentsByStatus,
      averageResponseTime,
      medianResponseTime,
      averageResolutionTime,
      medianResolutionTime,
      falseAlarmRate,
      escalationRate,
      reopenRate: 0, // Placeholder
      incidentTrend,
      topIncidentTypes,
      topLocations: [], // Placeholder
      slaCompliance: {
        responseTime: 85, // Placeholder percentage
        resolutionTime: 78  // Placeholder percentage
      }
    }
  }

  // Helper methods
  private calculatePriority(severity: Incident['severity'], type: Incident['type']): Incident['priority'] {
    if (severity === 'critical') return 'urgent'
    if (severity === 'high') return 'high'
    if (type === 'emergency_alert' || type === 'medical_emergency') return 'high'
    if (severity === 'medium') return 'medium'
    return 'low'
  }

  private calculateRiskScore(incident: Incident): number {
    let score = 0
    
    // Base score by severity
    switch (incident.severity) {
      case 'critical': score += 80; break
      case 'high': score += 60; break
      case 'medium': score += 40; break
      case 'low': score += 20; break
    }
    
    // Additional score by type
    if (incident.type === 'security_breach') score += 30
    if (incident.type === 'medical_emergency') score += 20
    if (incident.type === 'natural_disaster') score += 25
    
    // Impact modifiers
    if (incident.impact.peopleAffected > 10) score += 20
    if (incident.impact.businessImpact === 'severe') score += 30
    
    return Math.min(score, 100)
  }

  private mapIncidentSeverityToSecuritySeverity(severity: Incident['severity']): 'low' | 'medium' | 'high' | 'critical' {
    return severity
  }

  private calculateResponseTime(incident: Incident): number {
    const startEvent = incident.details.timelineEvents.find(e => e.type === 'incident_start')
    const responseEvent = incident.details.timelineEvents.find(e => e.type === 'response_initiated')
    
    if (!startEvent || !responseEvent) return 0
    
    const startTime = new Date(startEvent.timestamp).getTime()
    const responseTime = new Date(responseEvent.timestamp).getTime()
    
    return (responseTime - startTime) / (1000 * 60) // minutes
  }

  private calculateResolutionTime(incident: Incident): number {
    const startTime = new Date(incident.occurredAt).getTime()
    const resolvedTime = incident.resolution.resolvedAt
      ? new Date(incident.resolution.resolvedAt).getTime()
      : Date.now()
    
    return (resolvedTime - startTime) / (1000 * 60) // minutes
  }

  private calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2
    }
    return sorted[middle]
  }

  private validateIncident(incident: Incident): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!incident.title || incident.title.trim().length < 3) {
      errors.push('Incident title must be at least 3 characters')
    }

    if (!incident.description || incident.description.trim().length < 10) {
      errors.push('Incident description must be at least 10 characters')
    }

    if (!incident.reporting.reportedBy) {
      errors.push('Reporter user ID is required')
    }

    if (!incident.occurredAt) {
      errors.push('Incident occurrence time is required')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
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
  getIncidents(filter?: {
    type?: Incident['type']
    severity?: Incident['severity']
    status?: Incident['status']
    startDate?: string
    endDate?: string
    organizationId?: string
  }): Incident[] {
    let incidents = Array.from(this.incidents.values())

    if (filter) {
      if (filter.type) {
        incidents = incidents.filter(i => i.type === filter.type)
      }
      if (filter.severity) {
        incidents = incidents.filter(i => i.severity === filter.severity)
      }
      if (filter.status) {
        incidents = incidents.filter(i => i.status === filter.status)
      }
      if (filter.startDate) {
        incidents = incidents.filter(i => i.occurredAt >= filter.startDate!)
      }
      if (filter.endDate) {
        incidents = incidents.filter(i => i.occurredAt <= filter.endDate!)
      }
      if (filter.organizationId) {
        incidents = incidents.filter(i => i.reporting.organizationId === filter.organizationId)
      }
    }

    return incidents.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
  }

  getIncident(incidentId: string): Incident | null {
    return this.incidents.get(incidentId) || null
  }

  getReports(incidentId?: string): IncidentReport[] {
    const reports = Array.from(this.reports.values())
    return incidentId
      ? reports.filter(report => report.incidentId === incidentId)
      : reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  getReport(reportId: string): IncidentReport | null {
    return this.reports.get(reportId) || null
  }

  // Cleanup
  destroy(): void {
    this.incidents.clear()
    this.reports.clear()
    this.eventCallbacks.clear()
  }
}

export default IncidentReportingService.getInstance()