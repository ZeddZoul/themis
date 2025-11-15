# Deterministic Compliance Engine Implementation Plan

## ✅ Completed

### 1. Deterministic Rules Engine Created
- **File**: `lib/compliance-rules.ts`
- **Features**:
  - Static, deterministic rule definitions
  - Each rule has: `ruleId`, `platform`, `severity`, `category`, `description`, `checkLogic`, `staticSolution`
  - Deterministic check functions (same input = same output)
  - 8 core rules defined (4 for Apple, 4 for Google)
  - `evaluateRules()` function for consistent evaluation

## 🚧 Next Steps

### 2. Update Compliance Service (Hybrid System)
**File**: `lib/compliance.ts`

**Changes needed**:
1. Import and use `evaluateRules()` from `compliance-rules.ts`
2. Replace AI-only analysis with deterministic engine
3. Add AI augmentation pipeline after deterministic check
4. Update `ComplianceIssue` interface to include AI fields

**New Interface**:
```typescript
interface ComplianceIssue {
  // Deterministic fields (from rules engine)
  ruleId: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  solution: string; // Static solution from rule
  file?: string;
  
  // AI-augmented fields (optional)
  aiPinpointLocation?: {
    filePath: string;
    lineNumbers: number[];
  };
  aiSuggestedFix?: {
    explanation: string;
    codeSnippet: string;
  };
}
```

### 3. AI Augmentation Pipeline
**Purpose**: Enhance deterministic findings with contextual intelligence

**Process**:
1. Run deterministic engine → Get violations
2. For each violation:
   - Extract relevant file content
   - Call AI with structured prompt
   - Parse AI response for pinpoint location + suggested fix
   - Attach AI data to issue

**AI Prompt Structure**:
```
You are a code compliance expert. A violation has been detected:

Rule: [ruleId] - [description]
File: [filePath]
Content:
[file content with line numbers]

Tasks:
1. Identify the exact line numbers where this rule is violated
2. Provide a specific code fix for this file

Respond in JSON:
{
  "lineNumbers": [array of line numbers],
  "explanation": "why this violates the rule",
  "codeSnippet": "suggested fix code"
}
```

### 4. Update Database Schema
**File**: `prisma/schema.prisma`

**Changes**:
```prisma
model CheckRun {
  // ... existing fields
  issues Json? // Now stores enhanced structure with AI fields
}
```

### 5. Update Frontend Components
**Files**: 
- `components/results/IssueCard.tsx`
- `app/check/[repoId]/page.tsx`

**Changes**:
- Display `ruleId` badge
- Show AI pinpoint location if available
- Display AI-suggested code fix
- Fallback to static solution if AI unavailable

### 6. Benefits of This Architecture

**Deterministic Core**:
- ✅ Same repo + branch + platform = Same issues every time
- ✅ Predictable, testable, reliable
- ✅ No AI hallucinations in core findings
- ✅ Fast evaluation (no AI calls for detection)

**AI Augmentation**:
- ✅ Contextual, file-specific solutions
- ✅ Exact line number pinpointing
- ✅ Code snippets tailored to user's codebase
- ✅ Enhanced user experience
- ✅ Optional (system works without it)

**Hybrid Power**:
- ✅ Reliability of rules engine
- ✅ Intelligence of AI
- ✅ Best of both worlds

## 📊 Comparison

### Before (AI-Only):
```
Files → AI Analysis → Issues (non-deterministic)
```
- ❌ Different results each run
- ❌ Unpredictable
- ❌ Slow (AI for everything)

### After (Hybrid):
```
Files → Rules Engine → Violations (deterministic)
         ↓
      AI Augmentation → Enhanced Issues
```
- ✅ Consistent core findings
- ✅ AI adds value without risk
- ✅ Fast + Smart

## 🎯 Implementation Priority

1. **High Priority**: Update `lib/compliance.ts` to use rules engine
2. **Medium Priority**: Add AI augmentation pipeline
3. **Low Priority**: Update UI to show AI enhancements

## 📝 Testing Strategy

1. **Deterministic Tests**: Same input → Same output
2. **Rule Coverage**: Each rule has test cases
3. **AI Fallback**: System works without AI
4. **Performance**: Rules engine is fast (<100ms)

## 🚀 Rollout Plan

1. Deploy deterministic engine (immediate reliability)
2. Add AI augmentation (gradual enhancement)
3. Monitor AI quality and adjust prompts
4. Collect user feedback on AI suggestions
