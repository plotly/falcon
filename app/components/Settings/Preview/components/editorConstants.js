
export const controlPanelStyle = {
    padding: '10px 20px',
    margin: '20px 0',
    background: '#f3f6fa',
    minHeight: '0.2rem',
    height: '100%',
    textAlign: 'left',
    color: '#506784',
    overflow: 'auto',
    border: '1px solid #dfe8f3',
    borderRadius: '6px'
};

export const columnSelectLabelStyle = {
    fontWeight: '300',
    fontSize: '14px',
    display: 'inline',
    marginRight: '10px',
    width: 'auto'
};

export const dropdownContainerStyle = {
    marginBottom: '10px',
    height: '30px'
};

export const selectDropdownStyle = {
    display: 'inline-block',
    outline: 'none'
};

export const submitStyle = {
    background: '#fff', 
    padding: '10px',
    cursor: 'pointer',
    border: '1px solid #c8d4e3',
    fontSize: '12px',
    width: '100%',
    float: 'right'
};

export const PLOT_TYPES = [
    {label: 'Scatter', value: 'scatter'},
    {label: 'Bar', value: 'bar'},
    {label: 'Pie', value: 'pie'},
    {label: 'Line', value: 'line'},
    {label: 'Area', value: 'area'},
    {label: 'Histogram', value: 'histogram'},
    {label: 'Box Plot', value: 'box'},
    {label: 'Candlestick Plot', value: 'candlestick'},    
    {label: 'OHLC Plot', value: 'ohlc'},        
    {label: 'US [x=lat, y=lon]', value: 'scattergeo-usa'},
    {label: 'World [x=lat, y=lon]', value: 'scattergeo-world'},    
    {label: 'US [x=state, y=value]', value: 'choropleth-usa'},
    {label: 'World [x=country, y=value]', value: 'choropleth-world'}            
];

export const DEFAULT_DATA = [{x: [1, 2, 3, 4], y: [1, 4, 9, 16]}];
export const DEFAULT_LAYOUT = {margin: {t: 10, l: 40}};
export const DEFAULT_COLORS = ['#19d3f3', '#e763fa', '#ab63fa', '#636efa', '#00cc96', '#d36046'];

export const xAxisDropStyle = {
    height: '4rem',
    color: '#2a3f5f',
    padding: '0.5rem',
    borderRadius: '6px',
    border: '1px solid #dfe8f3'    
};

export const yAxisDropStyle = {
    height: '100%',
    width: '8rem',
    color: '#2a3f5f',
    padding: '0.5rem',
    backgroundColor: 'rgb(243, 246, 250)',
    borderRadius: '6px',
    border: '1px solid #dfe8f3'
};
