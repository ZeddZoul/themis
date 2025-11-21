import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register fonts
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v1/1.ttf' }, // Fallback or standard font
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v1/2.ttf', fontWeight: 'bold' },
  ]
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    margin: 10,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 100,
    fontSize: 10,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
    fontSize: 10,
    color: '#111827',
  },
  summaryBox: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 4,
    marginTop: 10,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#4B5563',
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827',
  },
  issueCard: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
    borderLeftWidth: 3,
  },
  issueHigh: {
    borderLeftColor: '#EF4444',
  },
  issueMedium: {
    borderLeftColor: '#F59E0B',
  },
  issueLow: {
    borderLeftColor: '#3B82F6',
  },
  issueTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  issueMeta: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 8,
  },
  issueDescription: {
    fontSize: 10,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 1.4,
  },
  issueSolution: {
    fontSize: 10,
    color: '#059669',
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
});

interface ComplianceReportProps {
  data: {
    repoName: string;
    branchName?: string;
    checkType?: string;
    date: string;
    summary: {
      totalIssues: number;
      highSeverity: number;
      mediumSeverity: number;
      lowSeverity: number;
    };
    issues: Array<{
      severity: 'high' | 'medium' | 'low';
      category: string;
      description: string;
      solution: string;
      file?: string;
      ruleId?: string;
    }>;
  };
}

export const ComplianceReportPDF = ({ data }: ComplianceReportProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Themis Compliance Report</Text>
        <Text style={styles.subtitle}>Automated Compliance Analysis</Text>
      </View>

      {/* Repository Info */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Repository:</Text>
          <Text style={styles.value}>{data.repoName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Branch:</Text>
          <Text style={styles.value}>{data.branchName || 'main'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Platform:</Text>
          <Text style={styles.value}>{data.checkType || 'Unknown'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{data.date}</Text>
        </View>
      </View>

      {/* Executive Summary */}
      <Text style={styles.sectionTitle}>Executive Summary</Text>
      <View style={styles.summaryBox}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Issues Found:</Text>
          <Text style={styles.summaryValue}>{data.summary.totalIssues}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Critical / High Severity:</Text>
          <Text style={[styles.summaryValue, { color: '#EF4444' }]}>{data.summary.highSeverity}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Medium Severity:</Text>
          <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{data.summary.mediumSeverity}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Low Severity:</Text>
          <Text style={[styles.summaryValue, { color: '#3B82F6' }]}>{data.summary.lowSeverity}</Text>
        </View>
      </View>

      {/* Issues List */}
      {data.issues.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Detailed Findings</Text>
          {data.issues.map((issue, index) => (
            <View key={index} style={[
              styles.issueCard,
              issue.severity === 'high' ? styles.issueHigh :
              issue.severity === 'medium' ? styles.issueMedium :
              styles.issueLow
            ]} wrap={false}>
              <Text style={styles.issueTitle}>
                {index + 1}. {issue.category}
              </Text>
              <Text style={styles.issueMeta}>
                Severity: {issue.severity.toUpperCase()} | Rule ID: {issue.ruleId || 'N/A'}
                {issue.file ? ` | File: ${issue.file}` : ''}
              </Text>
              <Text style={styles.issueDescription}>
                {issue.description}
              </Text>
              <Text style={styles.issueSolution}>
                Recommendation: {issue.solution}
              </Text>
            </View>
          ))}
        </>
      ) : (
        <View style={styles.section}>
          <Text style={{ color: '#059669', fontSize: 14, textAlign: 'center', marginTop: 20 }}>
            ✅ No compliance issues found. Great job!
          </Text>
        </View>
      )}

      {/* Footer */}
      <Text style={styles.footer}>
        Generated by Themis Compliance Engine • {data.date} • Page 1
      </Text>
    </Page>
  </Document>
);
