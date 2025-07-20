import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, ArrowRight, Loader2 } from 'lucide-react'

interface BridgeStatusProps {
  currentStep: 'idle' | 'bridging' | 'bridge-confirmed' | 'approving' | 'swapping' | 'complete'
  bridgeTxHash?: string
  swapTxHash?: string
}

const steps = [
  { id: 'bridging', label: 'Bridge to Abstract', description: 'Transferring ETH to Abstract network' },
  { id: 'complete', label: 'Complete', description: 'ETH successfully bridged to Abstract' }
]

export const BridgeStatus: React.FC<BridgeStatusProps> = ({
  currentStep,
  bridgeTxHash,
  swapTxHash
}) => {
  if (currentStep === 'idle') return null

  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId)
    const currentIndex = steps.findIndex(s => s.id === currentStep)
    
    if (stepIndex < currentIndex || currentStep === 'complete') {
      return 'completed'
    } else if (stepIndex === currentIndex) {
      return 'active'
    } else {
      return 'pending'
    }
  }

  const getStepIcon = (stepId: string) => {
    const status = getStepStatus(stepId)
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success" />
      case 'active':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />
      case 'pending':
        return <Clock className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getStepBadge = (stepId: string) => {
    const status = getStepStatus(stepId)
    
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-success/10 text-success border-success/20">Completed</Badge>
      case 'active':
        return <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">Processing</Badge>
      case 'pending':
        return <Badge variant="outline">Pending</Badge>
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ArrowRight className="w-5 h-5" />
          Bridge Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3">
              {getStepIcon(step.id)}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{step.label}</span>
                  {getStepBadge(step.id)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        {bridgeTxHash && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-1">Bridge Transaction:</p>
            <code className="text-xs bg-muted px-2 py-1 rounded break-all">
              {bridgeTxHash.slice(0, 10)}...{bridgeTxHash.slice(-10)}
            </code>
          </div>
        )}
        
      </CardContent>
    </Card>
  )
}