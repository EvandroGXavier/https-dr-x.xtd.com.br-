import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ShieldCheck, ShieldX, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { SecurityMonitoring } from '@/lib/dataSecurity';

interface SecurityIssue {
  id: string;
  level: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  status: 'fixed' | 'pending' | 'manual_action';
  remediation?: string;
  link?: string;
}

export const SecurityAlert = () => {
  const [securityOverview, setSecurityOverview] = useState<{
    recentSuspiciousActivity: number;
    failedAuthAttempts: number;
    sensitiveDataAccesses: number;
    securityScore: number;
  } | null>(null);
  
  const [loading, setLoading] = useState(true);

  const securityIssues: SecurityIssue[] = [
    {
      id: 'customer_data_protection',
      level: 'critical',
      title: 'Customer Personal Data Protection',
      description: 'Enhanced protection for sensitive customer data including CPF, emails, and phone numbers',
      status: 'fixed',
      remediation: 'Implemented advanced data masking, breach detection, and secure access logging'
    },
    {
      id: 'data_breach_detection',
      level: 'high', 
      title: 'Data Breach Pattern Detection',
      description: 'Real-time monitoring for suspicious bulk exports and unusual access patterns',
      status: 'fixed',
      remediation: 'Added intelligent breach detection with automated alerts for unusual activity'
    },
    {
      id: 'access_validation',
      level: 'high',
      title: 'Enhanced Access Validation',
      description: 'Server-side validation for all contact operations with security logging',
      status: 'fixed',
      remediation: 'Implemented secure validation functions with comprehensive permission checks'
    },
    {
      id: 'otp_expiry',
      level: 'medium',
      title: 'OTP Expiry Configuration',
      description: 'OTP expiry times exceed recommended security thresholds',
      status: 'manual_action',
      remediation: 'Configure Email OTP: 1 hour, SMS/Phone OTP: 10 minutes',
      link: 'https://supabase.com/docs/guides/platform/going-into-prod#security'
    },
    {
      id: 'password_protection',
      level: 'medium',
      title: 'Leaked Password Protection',
      description: 'Password protection against leaked passwords is currently disabled',
      status: 'manual_action',
      remediation: 'Enable "Password Protection" in Supabase Authentication settings',
      link: 'https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection'
    }
  ];

  useEffect(() => {
    const loadSecurityOverview = async () => {
      try {
        const overview = await SecurityMonitoring.getSecurityOverview();
        setSecurityOverview(overview);
      } catch (error) {
        console.error('Failed to load security overview:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSecurityOverview();
  }, []);

  const getIssueIcon = (status: SecurityIssue['status']) => {
    switch (status) {
      case 'fixed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'manual_action':
        return <ShieldX className="h-4 w-4 text-destructive" />;
      default:
        return <Shield className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getLevelColor = (level: SecurityIssue['level']) => {
    switch (level) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const fixedIssues = securityIssues.filter(issue => issue.status === 'fixed');
  const pendingIssues = securityIssues.filter(issue => issue.status !== 'fixed');

  return (
    <div className="space-y-6">
      {/* Security Score Overview */}
      {securityOverview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-success" />
              Security Status Overview
            </CardTitle>
            <CardDescription>
              Current security score and recent activity monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{securityOverview.securityScore}%</div>
                <div className="text-sm text-muted-foreground">Security Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{securityOverview.recentSuspiciousActivity}</div>
                <div className="text-sm text-muted-foreground">Suspicious Activity</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{securityOverview.sensitiveDataAccesses}</div>
                <div className="text-sm text-muted-foreground">Data Accesses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{securityOverview.failedAuthAttempts}</div>
                <div className="text-sm text-muted-foreground">Failed Auth</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Fixes Applied */}
      {fixedIssues.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Security Fixes Applied Successfully</AlertTitle>
          <AlertDescription>
            {fixedIssues.length} critical security enhancements have been implemented to protect your customer data.
          </AlertDescription>
        </Alert>
      )}

      {/* Pending Manual Actions */}
      {pendingIssues.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Manual Security Configuration Required</AlertTitle>
          <AlertDescription>
            {pendingIssues.length} security configuration{pendingIssues.length > 1 ? 's require' : ' requires'} manual action in your Supabase dashboard.
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Security Issues */}
      <Card>
        <CardHeader>
          <CardTitle>Security Issue Details</CardTitle>
          <CardDescription>
            Comprehensive overview of all security measures and required actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityIssues.map((issue) => (
              <div key={issue.id} className="flex items-start gap-3 p-4 border rounded-lg">
                <div className="mt-0.5">
                  {getIssueIcon(issue.status)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{issue.title}</h4>
                    <Badge variant={getLevelColor(issue.level) as any}>
                      {issue.level.toUpperCase()}
                    </Badge>
                    {issue.status === 'fixed' && (
                      <Badge variant="secondary">FIXED</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{issue.description}</p>
                  {issue.remediation && (
                    <p className="text-sm font-medium">{issue.remediation}</p>
                  )}
                  {issue.link && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={issue.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                        <ExternalLink className="h-3 w-3" />
                        View Documentation
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Configure OTP expiry times in Supabase Dashboard → Authentication → Settings</li>
            <li>Enable password protection against leaked passwords</li>
            <li>Review security audit logs regularly for suspicious activity</li>
            <li>Test authentication flows after configuration changes</li>
            <li>Schedule regular security reviews (monthly recommended)</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};