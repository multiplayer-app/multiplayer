import { Toolbar } from 'src/components/ui/Toolbar'

interface ChartBlockTabsProps {
  tab: 'javascript' | 'html' | 'css'
  onChange: (tab: 'javascript' | 'html' | 'css') => void
}

const ChartBlockTabs = ({ tab, onChange }: ChartBlockTabsProps) => {
  return (
    <>
      <TabButton isActive={tab === 'javascript'} onChange={onChange} tab="javascript">
        JavaScript
      </TabButton>
      <TabButton isActive={tab === 'html'} onChange={onChange} tab="html">
        HTML
      </TabButton>
      <TabButton isActive={tab === 'css'} onChange={onChange} tab="css">
        CSS
      </TabButton>
    </>
  )
}

const TabButton = ({ children, isActive, onChange, tab }) => {
  return (
    <Toolbar.Button onClick={() => onChange(tab)} variant="ghost" active={isActive}>
      {children}
    </Toolbar.Button>
  )
}

export default ChartBlockTabs
