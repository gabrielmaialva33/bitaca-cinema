// ===============================================
// BITACA CINEMA - D3.JS VISUALIZATIONS
// Interactive data visualizations for voting statistics
// Used in voice mode and analytics dashboard
// ===============================================

/**
 * D3 Visualization System for Bitaca Cinema
 * Creates interactive charts for voting data, production statistics, and analytics
 */

export class D3Visualizations {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.d3 = null;
        this.charts = new Map();
        this.init();
    }

    async init() {
        // Load D3.js dynamically
        await this.loadD3();
        console.log('✅ D3 Visualizations initialized');
    }

    async loadD3() {
        if (window.d3) {
            this.d3 = window.d3;
            return;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js';
            script.onload = () => {
                this.d3 = window.d3;
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Create Bar Chart for Film Ratings
     * @param {Array} data - [{filmId, title, averageRating, voteCount}]
     * @param {HTMLElement} container
     */
    createFilmRatingsChart(data, container) {
        const d3 = this.d3;
        if (!d3) return;

        // Clear existing chart
        d3.select(container).selectAll('*').remove();

        const margin = { top: 40, right: 30, bottom: 100, left: 60 };
        const width = container.clientWidth - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;

        // Create SVG
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Scales
        const x = d3.scaleBand()
            .domain(data.map(d => d.title))
            .range([0, width])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, 5])
            .range([height, 0]);

        // Color scale
        const colorScale = d3.scaleSequential()
            .domain([0, 5])
            .interpolator(d3.interpolateRgb('#9B1B30', '#2D5016'));

        // X Axis
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end')
            .style('font-size', '12px')
            .style('fill', '#0A0A0A');

        // Y Axis
        svg.append('g')
            .call(d3.axisLeft(y))
            .style('font-size', '14px')
            .style('fill', '#0A0A0A');

        // Y Axis Label
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('fill', '#0A0A0A')
            .text('Avaliação Média');

        // Bars
        svg.selectAll('.bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.title))
            .attr('width', x.bandwidth())
            .attr('y', height)
            .attr('height', 0)
            .attr('fill', d => colorScale(d.averageRating))
            .on('mouseover', function (event, d) {
                // Tooltip
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('opacity', 0.7);

                // Show tooltip
                const tooltip = d3.select('body')
                    .append('div')
                    .attr('class', 'd3-tooltip')
                    .style('position', 'absolute')
                    .style('background', '#0A0A0A')
                    .style('color', '#F5DEB3')
                    .style('padding', '10px')
                    .style('border-radius', '8px')
                    .style('pointer-events', 'none')
                    .style('font-size', '14px')
                    .style('z-index', '10000')
                    .html(`
                        <strong>${d.title}</strong><br>
                        Avaliação: ⭐ ${d.averageRating.toFixed(1)}/5<br>
                        Votos: ${d.voteCount}
                    `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('opacity', 1);

                d3.selectAll('.d3-tooltip').remove();
            })
            .transition()
            .duration(800)
            .delay((d, i) => i * 100)
            .attr('y', d => y(d.averageRating))
            .attr('height', d => height - y(d.averageRating));

        // Value labels on bars
        svg.selectAll('.label')
            .data(data)
            .enter()
            .append('text')
            .attr('class', 'label')
            .attr('x', d => x(d.title) + x.bandwidth() / 2)
            .attr('y', height)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#0A0A0A')
            .text(d => d.averageRating.toFixed(1))
            .transition()
            .duration(800)
            .delay((d, i) => i * 100)
            .attr('y', d => y(d.averageRating) - 5);

        // Title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .style('fill', '#C41E3A')
            .text('Avaliações das Produções');

        return svg.node();
    }

    /**
     * Create Pie Chart for Theme Distribution
     * @param {Object} data - {patrimonio: 9, musica: 8, ambiente: 7}
     * @param {HTMLElement} container
     */
    createThemeDistributionChart(data, container) {
        const d3 = this.d3;
        if (!d3) return;

        d3.select(container).selectAll('*').remove();

        const width = 400;
        const height = 400;
        const radius = Math.min(width, height) / 2;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);

        // Prepare data
        const pieData = [
            { label: 'Patrimônio & Memória', value: data.patrimonio || 0, color: '#C41E3A' },
            { label: 'Cultura Musical', value: data.musica || 0, color: '#2D5016' },
            { label: 'Meio Ambiente & Urbano', value: data.ambiente || 0, color: '#8B4513' }
        ];

        const pie = d3.pie()
            .value(d => d.value)
            .sort(null);

        const arc = d3.arc()
            .innerRadius(radius * 0.5)
            .outerRadius(radius * 0.8);

        const outerArc = d3.arc()
            .innerRadius(radius * 0.9)
            .outerRadius(radius * 0.9);

        // Draw slices
        const slices = svg.selectAll('.slice')
            .data(pie(pieData))
            .enter()
            .append('g')
            .attr('class', 'slice');

        slices.append('path')
            .attr('d', arc)
            .attr('fill', d => d.data.color)
            .attr('opacity', 0.8)
            .on('mouseover', function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('opacity', 1)
                    .attr('transform', 'scale(1.05)');

                // Tooltip
                d3.select('body')
                    .append('div')
                    .attr('class', 'd3-tooltip')
                    .style('position', 'absolute')
                    .style('background', '#0A0A0A')
                    .style('color', '#F5DEB3')
                    .style('padding', '10px')
                    .style('border-radius', '8px')
                    .style('font-size', '14px')
                    .style('z-index', '10000')
                    .html(`
                        <strong>${d.data.label}</strong><br>
                        ${d.data.value} produções (${((d.data.value / d3.sum(pieData, p => p.value)) * 100).toFixed(1)}%)
                    `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('opacity', 0.8)
                    .attr('transform', 'scale(1)');

                d3.selectAll('.d3-tooltip').remove();
            })
            .transition()
            .duration(1000)
            .attrTween('d', function (d) {
                const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
                return function (t) {
                    return arc(interpolate(t));
                };
            });

        // Labels
        slices.append('text')
            .attr('transform', d => {
                const pos = outerArc.centroid(d);
                return `translate(${pos})`;
            })
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', '#0A0A0A')
            .text(d => d.data.value)
            .style('opacity', 0)
            .transition()
            .delay(1000)
            .duration(500)
            .style('opacity', 1);

        // Title
        svg.append('text')
            .attr('y', -radius - 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .style('fill', '#C41E3A')
            .text('Distribuição por Eixo Temático');

        // Legend
        const legend = svg.selectAll('.legend')
            .data(pieData)
            .enter()
            .append('g')
            .attr('class', 'legend')
            .attr('transform', (d, i) => `translate(0,${radius + 30 + i * 25})`);

        legend.append('rect')
            .attr('x', -60)
            .attr('width', 18)
            .attr('height', 18)
            .attr('fill', d => d.color);

        legend.append('text')
            .attr('x', -35)
            .attr('y', 9)
            .attr('dy', '.35em')
            .style('font-size', '12px')
            .style('fill', '#0A0A0A')
            .text(d => d.label);

        return svg.node();
    }

    /**
     * Create Line Chart for Voting Over Time
     * @param {Array} data - [{date: Date, votes: number}]
     * @param {HTMLElement} container
     */
    createVotingTimelineChart(data, container) {
        const d3 = this.d3;
        if (!d3) return;

        d3.select(container).selectAll('*').remove();

        const margin = { top: 40, right: 30, bottom: 50, left: 60 };
        const width = container.clientWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Scales
        const x = d3.scaleTime()
            .domain(d3.extent(data, d => d.date))
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.votes)])
            .nice()
            .range([height, 0]);

        // Line generator
        const line = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.votes))
            .curve(d3.curveMonotoneX);

        // Area generator
        const area = d3.area()
            .x(d => x(d.date))
            .y0(height)
            .y1(d => y(d.votes))
            .curve(d3.curveMonotoneX);

        // Add gradient
        const gradient = svg.append('defs')
            .append('linearGradient')
            .attr('id', 'area-gradient')
            .attr('gradientUnits', 'userSpaceOnUse')
            .attr('x1', 0)
            .attr('y1', y(0))
            .attr('x2', 0)
            .attr('y2', y(d3.max(data, d => d.votes)));

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#C41E3A')
            .attr('stop-opacity', 0.8);

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#2D5016')
            .attr('stop-opacity', 0.2);

        // Draw area
        svg.append('path')
            .datum(data)
            .attr('fill', 'url(#area-gradient)')
            .attr('d', area)
            .attr('opacity', 0)
            .transition()
            .duration(1000)
            .attr('opacity', 1);

        // Draw line
        const path = svg.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', '#C41E3A')
            .attr('stroke-width', 3)
            .attr('d', line);

        // Animate line drawing
        const pathLength = path.node().getTotalLength();
        path.attr('stroke-dasharray', pathLength)
            .attr('stroke-dashoffset', pathLength)
            .transition()
            .duration(2000)
            .ease(d3.easeLinear)
            .attr('stroke-dashoffset', 0);

        // Axes
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(6))
            .style('font-size', '12px');

        svg.append('g')
            .call(d3.axisLeft(y))
            .style('font-size', '12px');

        // Labels
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height + 40)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('fill', '#0A0A0A')
            .text('Data');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -45)
            .attr('x', -height / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('fill', '#0A0A0A')
            .text('Número de Votos');

        // Title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .style('fill', '#C41E3A')
            .text('Evolução dos Votos');

        return svg.node();
    }

    /**
     * Create Network Graph for Film Relationships
     * Shows which films are often voted together
     * @param {Array} nodes - Film nodes
     * @param {Array} links - Connections between films
     * @param {HTMLElement} container
     */
    createFilmNetworkGraph(nodes, links, container) {
        const d3 = this.d3;
        if (!d3) return;

        d3.select(container).selectAll('*').remove();

        const width = container.clientWidth;
        const height = 600;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Force simulation
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(50));

        // Links
        const link = svg.append('g')
            .selectAll('line')
            .data(links)
            .enter()
            .append('line')
            .attr('stroke', '#8B4513')
            .attr('stroke-width', d => Math.sqrt(d.value) * 2)
            .attr('opacity', 0.3);

        // Nodes
        const node = svg.append('g')
            .selectAll('circle')
            .data(nodes)
            .enter()
            .append('circle')
            .attr('r', 20)
            .attr('fill', d => d.theme === 'patrimonio' ? '#C41E3A' : d.theme === 'musica' ? '#2D5016' : '#8B4513')
            .attr('stroke', '#F5DEB3')
            .attr('stroke-width', 2)
            .call(this.drag(simulation));

        // Labels
        const label = svg.append('g')
            .selectAll('text')
            .data(nodes)
            .enter()
            .append('text')
            .text(d => d.title)
            .style('font-size', '12px')
            .style('fill', '#0A0A0A')
            .attr('text-anchor', 'middle')
            .attr('dy', 35);

        // Tooltips
        node.on('mouseover', function (event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('r', 25);

            d3.select('body')
                .append('div')
                .attr('class', 'd3-tooltip')
                .style('position', 'absolute')
                .style('background', '#0A0A0A')
                .style('color', '#F5DEB3')
                .style('padding', '10px')
                .style('border-radius', '8px')
                .style('font-size', '14px')
                .style('z-index', '10000')
                .html(`
                    <strong>${d.title}</strong><br>
                    Votos: ${d.voteCount}<br>
                    Avaliação: ⭐ ${d.rating.toFixed(1)}/5
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
            .on('mouseout', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', 20);

                d3.selectAll('.d3-tooltip').remove();
            });

        // Update positions
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);

            label
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        });

        return svg.node();
    }

    drag(simulation) {
        const d3 = this.d3;

        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    }

    /**
     * Clear all charts
     */
    clearAll() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.charts.clear();
    }
}

export default D3Visualizations;
