import { InView } from 'react-intersection-observer'

interface InViewWrapperProps extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  children: React.ReactNode
  rootMargin?: string
}

const InViewWrapper = ({ children }: InViewWrapperProps) => {
  return (
    <InView triggerOnce={false} as="div">
      {children}
    </InView>
  )
}

export default InViewWrapper
