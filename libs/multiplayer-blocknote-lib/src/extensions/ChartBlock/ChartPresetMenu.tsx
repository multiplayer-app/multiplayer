const presets = [
  {
    name: 'Bar',
    option: {
      xAxis: { data: ['A', 'B', 'C'] },
      yAxis: {},
      series: [{ type: 'bar', data: [5, 20, 36] }],
    },
  },
  {
    name: 'Pie',
    option: {
      series: [
        {
          type: 'pie',
          data: [
            { name: 'A', value: 40 },
            { name: 'B', value: 60 },
          ],
        },
      ],
    },
  },
]

export const ChartPresetMenu = ({ onSelect }: { onSelect: (opt: object) => void }) => {
  return (
    <div style={{ marginBottom: 8 }}>
      <label>Select Preset: </label>
      <select onChange={e => onSelect(presets[parseInt(e.target.value)].option)}>
        {presets.map((p, i) => (
          <option key={i} value={i}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  )
}
