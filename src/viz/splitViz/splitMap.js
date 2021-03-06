import * as d3v4 from 'd3';
import * as Datamap from 'datamaps';
import { histogramLocation, updateMouseover, resetMousover } from '../../util';

const radiusScaling = 0.85;
const radiusMin = 2.5;

let map;

const radiusScaleFloor = x => (x === 0 ? 0 : Math.max(Math.sqrt(x) * radiusScaling, radiusMin));

const update = (data, filteredData) => {
  let bubbleData;

  const view = document.getElementById('splitMapSelect').value;

  if (view === 'Origin') {
    map.bubbles([]);
    const histLoc = histogramLocation(data, filteredData, 'Origin', x => x.match(/\(([^)]+)\)/).pop());

    bubbleData = histLoc.map((elem) => {
      const coord = elem.key.split(',').map(parseFloat);
      return {
        name: [...elem.tags].join(', '),
        count: elem.value,
        radius: radiusScaleFloor(elem.value),
        latitude: coord[0],
        longitude: coord[1],
        fillKey: 'origin',
      };
    });
  } else if (view === 'Registration District') {
    map.bubbles([]);
    const histLoc = histogramLocation(data, filteredData, 'Registration District', x => x);

    bubbleData = histLoc.map((elem) => {
      const coord = elem.key.split(',').map(parseFloat);
      return {
        name: [...elem.tags].join(', '),
        count: elem.value,
        radius: radiusScaleFloor(elem.value),
        latitude: coord[0],
        longitude: coord[1],
        fillKey: 'district',
      };
    });
  } else {
    map.bubbles([]);
    const histLocOrigin = histogramLocation(data, filteredData, 'Origin', x => x.match(/\(([^)]+)\)/).pop());

    const bubbleDataOrigin = histLocOrigin.map((elem) => {
      const coord = elem.key.split(',').map(parseFloat);
      return {
        name: [...elem.tags].join(', '),
        count: elem.value,
        radius: radiusScaleFloor(elem.value),
        latitude: coord[0],
        longitude: coord[1],
        fillKey: 'origin',
      };
    });

    const histLocDistrict = histogramLocation(data, filteredData, 'Registration District', x => x);

    const bubbleDataDistrict = histLocDistrict.map((elem) => {
      const coord = elem.key.split(',').map(parseFloat);
      return {
        name: [...elem.tags].join(', '),
        count: elem.value,
        radius: radiusScaleFloor(elem.value),
        latitude: coord[0],
        longitude: coord[1],
        fillKey: 'district',
      };
    });

    bubbleData = bubbleDataOrigin.concat(bubbleDataDistrict);
  }

  map.bubbles(bubbleData, {
    popupOnHover: false,
  });

  const svg = d3v4.selectAll('.datamap');

  d3v4.selectAll('.datamaps-bubble')
    .on('mouseover', d => updateMouseover(d.name, d.count))
    .on('mouseout', resetMousover)
    .on('click', (d) => {
      let filter;
      if (d.fillKey === 'district') {
        filter = document.getElementById('registrationDistrictFilter');
      } else if (d.fillKey === 'origin') { // TODO: Something is up with this look at the console
        filter = document.getElementById('originFilter');
      }
      filter.value = d.name;
      filter.onchange();
    });

  svg.call(d3v4.zoom()
    .extent(
      [
        [0, 0],
        [document.getElementById('splitMapChart').offsetWidth, document.getElementById('splitMapChart').offsetHeight],
      ],
    )
    .scaleExtent([0, 8])
    .on('zoom', () => {
      svg.selectAll('g').attr('transform', d3v4.event.transform);
      svg.selectAll('.datamaps-bubble').each((d) => { // lol this is n^2 don't tell anyone
        const { name, fillKey, radius } = d;
        svg.selectAll('.datamaps-bubble').filter(dInner => dInner.name === name && dInner.fillKey === fillKey).attr('r', radius / d3v4.event.transform.k);
        // const { name, fillKey, radius } = d;
        // svg.selectAll('.datamaps-bubble')
        //   .filter(dInner => dInner.name === name && dInner.fillKey === fillKey)
        //   .attr('r', radiusScaleFloor(radius) / d3v4.event.transform.k);
      });
    }));
};

const init = (data, filteredData, height, width) => {
  const mapChart = document.getElementById('splitMapChart');
  mapChart.innerHTML = '';

  const fills = {
    district: '#efdc99',
    origin: '#684C00',
    defaultFill: '#CCCCCC',
  };
  map = new Datamap({
    element: mapChart,
    height,
    width,
    setProjection(element) { // eslint-disable-line
      const projection = d3.geo.equirectangular() // eslint-disable-line
        .center([80, -25])
        .scale(500);

      const path = d3.geo.path() // eslint-disable-line
        .projection(projection);

      return { path, projection };
    },
    geographyConfig: {
      popupOnHover: false,
      highlightOnHover: false,
    },
    fills,
  });

  update(data, filteredData);
};


export { init, update };
