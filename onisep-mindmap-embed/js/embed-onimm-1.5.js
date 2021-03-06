/**
 * 2014 © Onisep - tous droits réservés - version 1.5
 * 
 * Created by <jta@onisep.fr> 2014-04-14 (2014-07-01 for version 1.5)
 * Last update on 2014-09-23 by <jta@onisep.fr>
 *
 * Script aiming to render the mind map for a job
 *
 */

// Be sure d3.min.js is called before

"use strict";

function Onimm(id, met_id, data_uri, historic) {

	// internal object
	var onimm = {};

	onimm.vars = {
		id : "#"+id,
		data_uri : data_uri,
		used_data: [],
		unused_data: [],
		x_coordinates : [],
		y_coordinates : [],
		xCentral: 0,
		yCentral: 0,
		width : 600,
		half_width : 400,
		height : 400,
		half_height : 300,
		radius_job: 15,
		radius_info_job: 25,
		radius_hist_job: 10,
		radius_other_job: 5,
		coordination_color: "#C9D800",
		collaboration_color: "#558DB4",
		coordinated: {},
		is_coordinated: {},
		collaboration: {},
		specialisation: {},
		is_specialisation: {},
		totalNodes : 0,
		isZoom : null,
		isNodeCentralX: false,
		isNodeCentralY: false,
		positionSlide:0,
		new_y : 0,
		new_x : 0,
		current_height_modale: 0,
		historic : historic,
		csKeyFld : [],
		stroke_colors : []  // array with the color of each jobs circle, compute by init_color_node
	};

	onimm.vars.radius_job = 0.0375*onimm.vars.width;
	onimm.vars.radius_info_job = 0.0625*onimm.vars.width;
	onimm.vars.radius_hist_job = 0.025*onimm.vars.width;
	onimm.vars.radius_other_job = 0.0125*onimm.vars.width;
	onimm.vars.half_height = 0.5*onimm.vars.height;
	onimm.vars.half_width = 0.5*onimm.vars.width;

	// Change easily the coordinates of (some) elements here
	onimm.geo = {
		// Icon of a clock for history panel and the title Historic
		historic : {
			icon : {
				x : 0.28*onimm.vars.width,
				y : 0.0175*onimm.vars.height,
				width : 0.05*onimm.vars.width,
				height : 0.05*onimm.vars.width
			},
			title : {
				x : 0.33*onimm.vars.width,
				y : -0.02*onimm.vars.half_height,
				width : 0.15*onimm.vars.width,
				height : 0.15*onimm.vars.height
			},
			font_size : 0.015*onimm.vars.width
		},
		// The position of the box, icon, the line in the legend, the 3 texts ...
		legend : {
			rect : {
				x : 0.795*onimm.vars.width,
				y : 0.05*onimm.vars.half_height,
				width : 0.185*onimm.vars.width,
				height : 0.20*onimm.vars.height
			},
			icon : {
				x : 0.87*onimm.vars.width,
				y : 0.0275*onimm.vars.height,
				width : 0.05*onimm.vars.width,
				height :0.05*onimm.vars.width
			},
			line_legend_1 : {
				x1 : 0.81*onimm.vars.width,
				y1 : 0.22*onimm.vars.half_height,
				x2 : 0.84*onimm.vars.width,
				y2 : 0.22*onimm.vars.half_height
			},
			legend_1_text : {
				x : 0.825*onimm.vars.width,
				y : 0.15*onimm.vars.half_height,
				width : 0.15*onimm.vars.width,
				height : 0.15*onimm.vars.height
			},
			arrow_legend_1 : {
				x : 1.31*onimm.vars.half_width,
				y : 0.085*onimm.vars.height
			},
			line_legend_2 : {
				x1 : 0.81*onimm.vars.width,
				y1 : 0.35*onimm.vars.half_height,
				x2 : 0.84*onimm.vars.width,
				y2 : 0.35*onimm.vars.half_height
			},
			legend_2_text : {
				x : 0.825*onimm.vars.width,
				y : 0.285*onimm.vars.half_height,
				width : 0.15*onimm.vars.width,
				height : 0.15*onimm.vars.height
			},
			legend_3_text : {
				x : 0.79*onimm.vars.width,
				y : 0.40*onimm.vars.half_height,
				width : 0.190*onimm.vars.width
			}
		},
		// The modale window displaying information
		info_job : {
			width : 500,
			height : 480,
			x : 0.0625*onimm.vars.width,
			y : 0.005*onimm.vars.height
		}
	};


	/**
	 * create svg elements, load data from xml, start all listener
	 */
	onimm.init = function() {

		onimm.init_behavior();

		// Create the main SVG element container
		onimm.svg = d3.select(onimm.vars.id).append("svg:svg")
			.attr("width", onimm.vars.width)
			.attr("height", onimm.vars.height)
			.attr("align", "center")
			.style("border", "1px solid black")
			.attr("class", id + "-svg");

		/* ---- Define markers for design the bonds ---- */

		// coordinated mid bonds for coordination bonds (the central jobs coordinate them)
		onimm.marker_coordinated = onimm.svg.append("svg:defs")
			.append("svg:marker")
				.attr("id", "coordinated").attr("markerWidth", 0.125*onimm.vars.width).attr("markerHeight", 0.125*onimm.vars.height)
				.attr("refx", 0).attr("refy", 0).attr("orient", "auto").attr("style","overflow:visible");

		// The "d" define the shape (triangle)
		// Change translate for moving the shape on the line
		onimm.marker_coordinated.append("svg:path")
			.attr("d", "M -18,5 -18,-5 -23,0 Z")
			.attr("style", "fill:"+onimm.vars.coordination_color+"; stroke:"+onimm.vars.coordination_color+"; stroke-width:0.5px")
			.attr("transform", "translate(-5,0) scale(0.4)");

		// coordination mid bonds for coordination bonds (the central jobs is by other one)
		onimm.marker_coordination = onimm.svg.append("svg:defs")
			.append("svg:marker")
				.attr("id", "coordination").attr("markerWidth", 0.125*onimm.vars.width).attr("markerHeight", 0.125*onimm.vars.height)
				.attr("refx", 0).attr("refy", 0).attr("orient", "auto").attr("style","overflow:visible");

		// The "d" define the shape (triangle)
		// Change translate for moving the shape on the line
		onimm.marker_coordination.append("svg:path")
			.attr("d", "M -18,5 -18,-5 -12,0 Z")
			.attr("style", "fill:"+onimm.vars.coordination_color+"; stroke:"+onimm.vars.coordination_color+"; stroke-width:0.5px")
			.attr("transform", "translate(-5,0) scale(0.4)");

		// Create sub-container of Bond(s), James Bond
		onimm.bond_container = onimm.svg.append("g")
			.attr("transform", "translate(" + onimm.vars.half_width + "," + onimm.vars.half_height + ")")
			.attr("class", "bonds-container");

		// Create sub-container of other elements
		onimm.container = onimm.svg.append("g")
			.attr("transform", "translate(" + onimm.vars.half_width + "," + onimm.vars.half_height + ")")
			.attr("class", "jobs-container");

		// Load our resources
		d3.xml(data_uri, "application/xml", function(error, xml) {

			// DEBUG of D3 when import data
			if (error) return console.warn(error);

			// custom xml to json because it's better
			onimm.vars.data = onimm.xmlToJson(xml);
			onimm.vars.data = onimm.vars.data.CARTE_HEURISTIQUE.METIER.record;

			// Get arrays only for the job at the center and for convenience define arrays for bond relation
			for (var a = 0, l = onimm.vars.data.length; a<l; a++) {

				if (onimm.vars.data[a].MET_ID["#text"] === met_id) {

					onimm.vars.used_data.push(onimm.vars.data[a]);
					onimm.vars.coordinated = onimm.vars.data[a].Liens_metiers_supervise;
					onimm.vars.is_coordinated = onimm.vars.data[a].Liens_metiers_est_supervise;
					onimm.vars.collaboration = onimm.vars.data[a].Liens_metiers_collabore;
				}
			}


			// The loop search and put in array used_data the job that are bond to the central job.
			for (var k = 0, m = onimm.vars.data.length ; k<m; k++) {

				if (onimm.vars.collaboration.METIER.hasOwnProperty("record")) {
					if ($.isArray(onimm.vars.collaboration.METIER.record)) {
						for (var j = 0, l = onimm.vars.collaboration.METIER.record.length; j<l; j++) {
							if (onimm.vars.data[k].MET_ID['#text'] == onimm.vars.collaboration.METIER.record[j].MET_MET_ID['#text']) {
								onimm.vars.used_data.push(onimm.vars.data[k]);
							}
						}
					}
					else {
						if (onimm.vars.data[k].MET_ID["#text"] == onimm.vars.collaboration.METIER.record.MET_MET_ID['#text']) {
							onimm.vars.used_data.push(onimm.vars.data[k]);
						}
					}
				}

				if (onimm.vars.coordinated.METIER.hasOwnProperty("record")) {
					if ($.isArray(onimm.vars.coordinated.METIER.record)) {
						for (var j = 0, l = onimm.vars.coordinated.METIER.record.length; j<l ; j++) {
							if (onimm.vars.data[k].MET_ID["#text"] == onimm.vars.coordinated.METIER.record[j].MET_MET_ID['#text']) {
								onimm.vars.used_data.push(onimm.vars.data[k]);
							}
						}
					}
					else {
						if (onimm.vars.data[k].MET_ID["#text"] == onimm.vars.coordinated.METIER.record.MET_MET_ID['#text']) {
							onimm.vars.used_data.push(onimm.vars.data[k]);
						}
					}
				}

				if (onimm.vars.is_coordinated.METIER.hasOwnProperty("record")) {
					if ($.isArray(onimm.vars.is_coordinated.METIER.record)) {
						for (var j = 0, l = onimm.vars.is_coordinated.METIER.record.length; j<l; j++) {
							if (onimm.vars.data[k].MET_ID["#text"] == onimm.vars.is_coordinated.METIER.record[j].MET_MET_ID['#text']) {
								onimm.vars.used_data.push(onimm.vars.data[k]);
							}
						}
					}
					else {
						if (onimm.vars.data[k].MET_ID["#text"] == onimm.vars.is_coordinated.METIER.record.MET_MET_ID['#text']) {
							onimm.vars.used_data.push(onimm.vars.data[k]);
						}
					}	
				}
				
			}

			// all_data are all the jobs (even those we don't display)
			// used_data (and then data) are only the jobs we display
			onimm.vars.all_data = onimm.vars.data;
			onimm.vars.data = onimm.vars.used_data;
			
			// We get in unused_data array the jobs we don't display in the node shape
			for (var i = 0, l = onimm.vars.all_data.length; i<l; i++) {
				var is_in_array = 0;
				for (var j = 0, m = onimm.vars.used_data.length; j<m; j++) {
					if (onimm.vars.all_data[i].MET_ID["#text"] == onimm.vars.used_data[j].MET_ID["#text"]) {
						is_in_array++;
					}
				}
				if (is_in_array == 0) {
					onimm.vars.unused_data.push(onimm.vars.all_data[i]);
				}
			}

			// All svg g element with class jobs are bound with one job data
			onimm.jobs = onimm.container.selectAll("g")
				.data(onimm.vars.data);

			// csKeyFld is the id for the MET_DOMAINE in xml
			onimm.jobs = onimm.jobs.enter().append("svg:g")
				.attr("class", function(d){return "is-draggable jobs";})
				.attr("csKeyFld", function(d) {
					onimm.vars.csKeyFld.push(d.MET_DOMAINE["#text"]);
					return d.MET_DOMAINE["#text"];
				});

			onimm.vars.totalNodes = onimm.jobs.size();

			// The circles for the jobs ; color are compute by init_color_node, which depends on the colors chosen by
			// the Studio graphique or Pôle documentaire.
			onimm.circles = onimm.jobs.append("svg:circle")
				.attr("class", "jobs-circle")
				.attr("r", onimm.vars.radius_job)
				.attr("cx", function(d,i) {
					onimm.vars.x_coordinates.push(onimm.init_x_coordinates(d,i));
					return d.x = 1.2*onimm.init_x_coordinates(d,i);
				})
				.attr("cy", function(d,i) {
					onimm.vars.y_coordinates.push(onimm.init_y_coordinates(d,i));
					return d.y = 1.2*onimm.init_y_coordinates(d,i);
				})
				.attr("csKeyFld", function(d) {
					onimm.vars.csKeyFld.push(d.MET_DOMAINE["#text"]);
					return d.MET_DOMAINE["#text"];
				})
				.style("fill", function(d,i) {
					onimm.vars.stroke_colors.push(onimm.init_color_node(d));
					return onimm.init_color_node(d);
				})
				.attr("color_node", function(d,i) {
					return onimm.init_color_node(d);
				});

			onimm.circles.data(onimm.vars.data);

			// The texts below the jobs
			onimm.jobs_text = onimm.jobs.append("svg:foreignObject")
				.attr("class", "jobs-text-foreignObject")
				.attr("width", 0.215*onimm.vars.width)
				//.attr("height", 100)
				.attr("x", function(d,i) {
					return d.x = 1.2*onimm.vars.x_coordinates[i] - 3*onimm.vars.radius_job;
				})
				.attr("y", function(d,i) {
					if (i==0) {
						return d.y = onimm.vars.y_coordinates[i] + 1.2*onimm.vars.radius_job;
					}
					else return d.y = 1.2*onimm.vars.y_coordinates[i] + 0.6*onimm.vars.radius_job;
				})
				.append("xhtml:body").attr("class", "jobs-text-body")
					.html(function(d,i) {
						return "<p class='jobs-text'>"+d.CSLABELFLD["#text"]+"</p>";
					});

			// The font size is compute after
			d3.selectAll(".jobs-text").style("font-size", 0.019*onimm.vars.width+"px");

			// Set jobs-text-foreignObject height to be what we need, not more nor less
			var jobs_text_height = [];
			$(".jobs-text").each(function(index, element) {
				jobs_text_height.push(1.3*$(element).outerHeight());
			});
			d3.selectAll(".jobs-text-foreignObject").attr("height", function(d,i) {
				return jobs_text_height[i];
			});

			// Load for each jobs an bubble.flat.png image
			onimm.bubble = onimm.jobs.append("svg:foreignObject")
				.attr("class", "bubble-foreignObject")
				.attr("width", 2*onimm.vars.radius_job)
				.attr("height", 2*onimm.vars.radius_job)
				.attr("x", function(d,i) {
					return 1.2*onimm.vars.x_coordinates[i] - onimm.vars.radius_job;
				})
				.attr("y", function(d,i) {
					return 1.2*onimm.vars.y_coordinates[i] - onimm.vars.radius_job;
				})
				.append("xhtml:body").attr("class", "bubble-body")
					.html("<img class='bubble' src='./img/bubble-flat.png'>");

			onimm.bubble.data(onimm.vars.data);

			// Since moving the jobs and zooming is un-useful, and buggy on tablet, do not use !
			// onimm.jobs.call(onimm.vars.drag);
			// onimm.svg.call(onimm.vars.zoom);

			onimm.set_legend();
	
			onimm.init_bonds(onimm.vars.data);

			d3.select(".bubble-body")
				.html("<img class='bubble-info-icon' src='./img/bubble-info-flat.png'>");

			// Set legend again when clicking on help
			d3.select(".bubble-info-icon").on("dblclick", function(d,i) {});
			d3.select(".bubble-info-icon").on("click", function(d,i) {
				onimm.display_info_job(d, i, onimm.vars.data);
			});

			onimm.bubble.on("dblclick", function(d,i) {});
			onimm.bubble.on("click", function(d,i) {
				onimm.move_to_node(d,i,onimm.vars.data);
			});

			// Set historic svg elements
			onimm.set_historic();

			// Add the first hist_node to historic array (i.e the first loaded with the page)
			if (onimm.vars.historic.length < 1) {
				var node_hist = {
					name : onimm.vars.data[0].CSLABELFLD["#text"],
					met_id : met_id,
					met_domaine : onimm.vars.csKeyFld[0],
					stroke_color :  onimm.vars.stroke_colors[0],
					stroke_colors : onimm.vars.stroke_colors,
					x : 20,
					y : 20 + 30*onimm.vars.historic.length
				};

				onimm.vars.historic.push(node_hist);
			}

			// Historic is udpdated after building all nodes
			// Adding new node only if it is not already in historic
			if (onimm.vars.historic.length > 1) {
				for (var i = 0, l = onimm.vars.historic.length; i < l-1; i++) {
					if (onimm.vars.historic[i].met_id === onimm.vars.historic[l-1].met_id) {
						onimm.vars.historic.pop();
						break;
					}
				}

				// Only display 5 nodes of historic
				if (onimm.vars.historic.length > 5) {
					var shifted = onimm.vars.historic.shift();
					onimm.vars.historic[onimm.vars.historic.length-1].y = shifted.y;
				}
			}

			onimm.update_historic(met_id);

		}); // End d3.json(uri, met_id, function)
	};

	/* -----------------------------------------------------=== methods ===---------------------------------------- */

	/** color circle stroke based on the fonction of the job
	 * Onisep studio should chose the color when the time will come
	 */
	onimm.init_color_node = function(d) {
		
		// fonction exploitation
		if (d.MET_DOMAINE["#text"] == "102892") {
			return '#15C06F';
		}
		// fonction maintenance
		if (d.MET_DOMAINE["#text"] == "100174") {
			return '#FF6FEF';
		}
		// fonction marketing
		if (d.MET_DOMAINE["#text"] == "102876") {
			return "#B2FF48";
		}
		// fonction information - communication
		if (d.MET_DOMAINE["#text"] == "100154") {
			return '#9A82FF';
		}
		// fonction conception
		if (d.MET_DOMAINE["#text"] == "100158") {
			return '#FD6A8B';
		}
		// fonction création artistique
		if (d.MET_DOMAINE["#text"] == "100156") {
			return '#488BFE';
		}
		// fonction études développement informatique
		if (d.MET_DOMAINE["#text"] == "102869") {
			return '#BAB3FF';
		}
		// fonction conseil, audit, expertise
		if (d.MET_DOMAINE["#text"] == "100145") {
			return '#FCD919';
		}

		// TODO : get the id of MET_DOMAINE
		// fonction adminsitrative
		if (d.MET_DOMAINE["#text"] == "1001") {
			return '#33DDD0';
		}
		// fonction animation
		if (d.MET_DOMAINE["#text"] == "1001") {
			return '#FD4F84';
		}
		// fonction achats approvisionnement
		if (d.MET_DOMAINE["#text"] == "1001") {
			return '#BAB3FF';
		}
		// fonction administratin des ventes
		if (d.MET_DOMAINE["#text"] == "1001") {
			return '#7DCAFE';
		}
		// fonction distribution
		if (d.MET_DOMAINE["#text"] == "1001") {
			return '#D3FFC1';
		}
		// fonction import-export
		if (d.MET_DOMAINE["#text"] == "100") {
			return '#FDD580';
		}
		// fonction marketing
		if (d.MET_DOMAINE["#text"] == "100") {
			return '#91ACE6';
		}
		// fonction technico commercial
		if (d.MET_DOMAINE["#text"] == "100") {
			return '#FCA145';
		}
		// TODO : change the colors
		// fonction vente
		if (d.MET_DOMAINE["#text"] == "100") {
			return '#FCA145';
		}
		// fonction développement agricole
		if (d.MET_DOMAINE["#text"] == "100") {
			return '#FCA145';
		}
		// fonction études développement BTP
		if (d.MET_DOMAINE["#text"] == "100") {
			return '#FCA145';
		}
		// fonction études développement industriel
		if (d.MET_DOMAINE["#text"] == "100") {
			return '#FCA145';
		}
		// fonction conduite de projet
		if (d.MET_DOMAINE["#text"] == "100") {
			return '#FCA145';
		}
		// fonction contrôle
		if (d.MET_DOMAINE["#text"] == "100") {
			return '#FCA145';
		}
		// fonction essais
		if (d.MET_DOMAINE["#text"] == "100") {
			return '#FCA145';
		}
		// fonction mesure, analyse
		if (d.MET_DOMAINE["#text"] == "100") {
			return '#FCA145';
		}
		// fonction direction commerciale
		if (d.MET_DOMAINE["#text"] == "100") {
			return '#FCA145';
		}
		// fonction direction technique
		if (d.MET_DOMAINE["#text"] == "100") {
			return '#FCA145';
		}

		else {
			return '#000000';
		}

	};

	onimm.init_behavior = function() {
		// When moving the background
		onimm.vars.zoom = d3.behavior.zoom()
			.scaleExtent([1, 1])
			.on("zoomstart", onimm.zoomstart)
			.on("zoom", onimm.zoomed)
			.on("zoomend", onimm.zoomend);

		// When dragging a node
		onimm.vars.drag = d3.behavior.drag()
			.on("dragstart", onimm.dragstarted)
			.on("drag", onimm.dragged)
			.on("dragend", onimm.dragended);
	};

	// The zoom- functions are called if onimm.svg.call(onimm.vars.zoom); line 382 is not commented, but I think
	// it is buggy
	onimm.zoomstart = function(d) {
		d3.event.sourceEvent.stopPropagation();
	};

	onimm.zoomed = function(d) {
		onimm.vars.new_x = d3.event.translate[0] + onimm.vars.half_width;
		onimm.vars.new_y = d3.event.translate[1] + onimm.vars.half_height;
		onimm.container.attr("transform", "translate(" + onimm.vars.new_x + "," + onimm.vars.new_y + ")");
		onimm.bond_container.attr("transform", "translate(" + onimm.vars.new_x + "," + onimm.vars.new_y + ")");
	};

	onimm.zoomend = function(d) {
	};

	// ---- Drag'n'Drop elements ---
	// The drag'n'drop- functions are called if onimm.jobs.call(onimm.vars.drag); line 381 is not commented, but I think
	// it is buggy
	onimm.dragstarted = function(d) {
		d3.event.sourceEvent.stopPropagation();
		d3.select(this).classed("is-dragging", true);
	};

	// Admitted the dragged element is a svg group g with internal circle and text,
	// we change its coordinate, and it is a bit complex, but it works
	onimm.dragged = function(d) {
		d3.select(this).select('.jobs-circle').attr("cx", d3.event.x ).attr("cy", d3.event.y);
		//d3.select(this).attr("transform", "translate("+ d3.event.x +","+ d3.event.y +")");
		d3.select(this).select('.jobs-text-foreignObject')
			.attr("x", d3.event.x - 3*onimm.vars.radius_job)
			.attr("y", d3.event.y + 0.6*onimm.vars.radius_job)
			.on("mousedown", function() { d3.event.stopPropagation(); });
		d3.select(this).select('.bubble-foreignObject')
			.attr("x", d3.event.x - onimm.vars.radius_job).attr("y", d3.event.y - onimm.vars.radius_job)

		d.x = d3.event.x;
		d.y = d3.event.y;

		if(d.MET_ID["#text"] === met_id) {
			for(var a = 0, l = onimm.vars.totalNodes; a<l; a++) {
				d3.select("#bond-"+a)
					.attr("d", "M "+d3.event.x+","+d3.event.y+" C 0,0 0,0 "+ onimm.vars.x_coordinates[a]+","+ onimm.vars.y_coordinates[a] +"");
				if (onimm.bonds[a][0][0].attributes[3].nodeValue === d.MET_ID["#text"]) {
					onimm.vars.x_coordinates[onimm.bonds[a][0][0].attributes[2].nodeValue] = d3.event.x;
					onimm.vars.y_coordinates[onimm.bonds[a][0][0].attributes[2].nodeValue] = d3.event.y;
					onimm.vars.xCentral = d3.event.x;
					onimm.vars.yCentral = d3.event.y;
				}
			}
			d3.select(this).select('.bubble-foreignObject')
				.attr("x", d3.event.x - 10 - onimm.vars.radius_job).attr("y", d3.event.y - 10 - onimm.vars.radius_job);
			d3.select(this).select('.jobs-text-foreignObject')
				.attr("y", d3.event.y + 10 +onimm.vars.radius_job);

		}
		else {
			for (var a = 0, l = onimm.vars.totalNodes; a<l; a++) {
				if (onimm.bonds[a][0][0].attributes[3].nodeValue === d.MET_ID["#text"]) {
					onimm.vars.x_coordinates[a] = d3.event.x;
					onimm.vars.y_coordinates[a] = d3.event.y;
					d3.select("#bond-"+a)
						.attr("d", "M"+ onimm.vars.xCentral+","+onimm.vars.yCentral +"C 0,0 0,0 "+ onimm.vars.x_coordinates[a]+","+ onimm.vars.y_coordinates[a] +"");
				}
			}
		}
	};

	// When we move the modale window with the information about the job
	onimm.dragged_modale = function(d) {
		var moveX = d3.event.x - onimm.vars.half_width;
		var moveY = d3.event.y - 0.5*onimm.vars.half_height;
		d3.select('.info-job-container').attr("transform","translate("+ moveX +","+ moveY+")");
	};

	onimm.dragended = function(d) {
		d3.select(this).classed("is-dragging", false);
	};

	// Create the svg elements for the legend
	onimm.set_legend = function() {
		onimm.container_legend = onimm.svg.append("svg:g")
			.attr("class","legend-container");

		onimm.rect_legend = onimm.container_legend.append("svg:foreignObject").attr("class","legend-foreignObject")
			.attr("x", onimm.geo.legend.rect.x)
			.attr("y", onimm.geo.legend.rect.y)
			.attr("width", onimm.geo.legend.rect.width)
			.attr("height", onimm.geo.legend.rect.height)
			.append("xhtml:body").attr("class", "legend-body")
				.html(function(d,i) {
					return "<div class='legend-div'></div>";
				});

		// body and div in the legend-foreignObject should have the same size as their container
		$(".legend-body, .legend-div").width(1*d3.select(".legend-foreignObject").attr("width"));
		$(".legend-body, .legend-div").height(1*d3.select(".legend-foreignObject").attr("height"));

		onimm.legend_image = onimm.createForeignObject(
			onimm.container_legend,
			"legend-image",
			onimm.geo.legend.icon.width,
			onimm.geo.legend.icon.height,
			onimm.geo.legend.icon.x,
			onimm.geo.legend.icon.y
		);
		onimm.createImg(onimm.legend_image, "legend-image", "./img/legend-icon.png");

		onimm.legend_1 = onimm.container_legend.append("svg:line")
			.attr("class", function(d,i) {return "bond"})
			.attr("x1", onimm.geo.legend.line_legend_1.x1)
			.attr("y1", onimm.geo.legend.line_legend_1.y1)
			.attr("x2", onimm.geo.legend.line_legend_1.x2)
			.attr("y2", onimm.geo.legend.line_legend_1.y2)
			.attr("stroke-width","5").attr("stroke", onimm.vars.coordination_color);


		onimm.legend_1_text = onimm.container_legend.append("svg:foreignObject")
			.attr("class", "legend-text-foreignObject")
			.attr("width", onimm.geo.legend.legend_1_text.width)
			.attr("height", onimm.geo.legend.legend_1_text.height)
			.attr("x", onimm.geo.legend.legend_1_text.x)
			.attr("y", onimm.geo.legend.legend_1_text.y)
			.append("xhtml:body").attr("class", "legend-text-body")
				.html(function(d,i) {
					return "<p class='legend-text'>Coordonne</p>";
				});

		onimm.marker_coordinated_legend = onimm.container_legend.append("svg:path")
			.attr("d", "M -18,5 -18,-5 -23,0 Z")
			.attr("style", "fill:"+onimm.vars.coordination_color+"; stroke:"+onimm.vars.coordination_color+"; stroke-width:0.5px");

		onimm.marker_coordinated_legend.attr("transform", "scale(1.3) translate("+onimm.geo.legend.arrow_legend_1.x+","+onimm.geo.legend.arrow_legend_1.y+")");

		onimm.legend_2 = onimm.container_legend.append("svg:line")
			.attr("class", function(d,i) {return "bond"})
			.attr("x1", onimm.geo.legend.line_legend_2.x1)
			.attr("y1", onimm.geo.legend.line_legend_2.y1)
			.attr("x2", onimm.geo.legend.line_legend_2.x2)
			.attr("y2", onimm.geo.legend.line_legend_2.y2)
			.attr("stroke-width","5").attr("stroke", onimm.vars.collaboration_color);

		onimm.legend_2_text = onimm.container_legend.append("svg:foreignObject")
			.attr("class", "legend-text-foreignObject")
			.attr("width", onimm.geo.legend.legend_2_text.width)
			.attr("height", onimm.geo.legend.legend_2_text.height)
			.attr("x", onimm.geo.legend.legend_2_text.x)
			.attr("y", onimm.geo.legend.legend_2_text.y)
			.append("xhtml:body").attr("class", "legend-text-body")
				.html(function(d,i) {
					return "<p class='legend-text'>Collaboration</p>";
				});

		onimm.legend_3_text = onimm.container_legend.append("svg:foreignObject")
			.attr("class", "legend-instructions-foreignObject")
			.attr("width", onimm.geo.legend.legend_3_text.width)
			.attr("x", onimm.geo.legend.legend_3_text.x)
			.attr("y", onimm.geo.legend.legend_3_text.y)
			.append("xhtml:body").attr("class", "legend-instructions-body")
				.html(function(d,i) {
					return "<p class='legend-instructions'>Cliquez sur le noeud central pour avoir des informations</p>"
						+ "<hr>"
						+"<p class='legend-instructions'>Cliquez sur les autres noeuds pour naviguer vers eux.</p>";
				});

		onimm.more_legend = onimm.createForeignObject(
			onimm.container_legend,
			"legend-more",
			onimm.geo.legend.rect.x,
			0.055*onimm.vars.width,
			onimm.geo.legend.rect.x,
			0.40*onimm.vars.half_height
		);
		onimm.createImg(onimm.more_legend, "legend-more-icon", "./img/legend-more.png");

		d3.select(".legend-more-icon").style("width", 0.15*onimm.vars.width+"px");

		/**
		 * When we click on the "plus button", we get a the legend_3_text informations visible
		 */
		onimm.get_more_legend = function() {

			d3.select(".legend-foreignObject").transition().duration(400).attr("height", 0.5*onimm.vars.height);
			d3.select(".legend-foreignObject").style("height", 0.5*onimm.vars.height+"px");

			d3.select(".legend-div").transition().duration(400).attr("height", 0.55*onimm.vars.height);
			d3.select(".legend-div").style("height", 0.5*onimm.vars.height+"px");

			d3.select(".legend-body").transition().duration(500).attr("height", 0.55*onimm.vars.height);
			d3.select(".legend-body").style("height", 0.5*onimm.vars.height+"px");

			d3.select(".legend-instructions-foreignObject").transition().duration(700).attr("height", 0.30*onimm.vars.height);
			d3.select(".legend-more-foreignObject").remove();

			window.setTimeout(function() {
				onimm.less_legend = onimm.createForeignObject(
					onimm.container_legend,
					"legend-less",
					onimm.geo.legend.rect.x,
					0.055*onimm.vars.width,
					onimm.geo.legend.rect.x,
					onimm.vars.half_height
				);
				onimm.createImg(onimm.less_legend, "legend-less-icon", "./img/legend-less.png");

				d3.select(".legend-less-icon").style("width", 0.15*onimm.vars.width+"px");

				onimm.less_legend.on("click", function(d,i) {
					onimm.get_less_legend();
				});
			}, 500);

		};

		/**
		 * When we click on the "less button", we get a the legend_3_text informations visible
		 */
		onimm.get_less_legend = function() {

			d3.select(".legend-instructions-foreignObject").transition().duration(400).attr("height", 0*onimm.vars.height);
			

			d3.select(".legend-foreignObject").transition().duration(800).attr("height", 0.2*onimm.vars.height);
			d3.select(".legend-foreignObject").style("height", 0.2*onimm.vars.height+"px");

			d3.select(".legend-div").transition().duration(800).attr("height", 0.4*onimm.vars.half_height);
			d3.select(".legend-div").style("height", 0.4*onimm.vars.half_height+"px");

			d3.select(".legend-body").transition().duration(900).attr("height", 0.4*onimm.vars.half_height);
			d3.select(".legend-body").style("height", 0.4*onimm.vars.half_height+"px");

			d3.select(".legend-less-foreignObject").remove();
			window.setTimeout(function() {
				onimm.more_legend = onimm.createForeignObject(
					onimm.container_legend,
					"legend-more",
					onimm.geo.legend.rect.x,
					0.055*onimm.vars.width,
					onimm.geo.legend.rect.x,
					0.40*onimm.vars.half_height
				);
				onimm.createImg(onimm.more_legend, "legend-more-icon", "./img/legend-more.png");

				d3.select(".legend-more-icon").style("width", 0.15*onimm.vars.width+"px");

				onimm.more_legend.on("click", function(d,i) {
					onimm.get_more_legend();
				});

			}, 600);

		};

		onimm.more_legend.on("click", function(d,i) {
			onimm.get_more_legend();
		});

		onimm.legend_leave = onimm.createForeignObject(onimm.container_legend, "legend-close", 0.05*onimm.vars.width, 0.05*onimm.vars.width, 0.95*onimm.vars.width, 0);
		onimm.createImg(onimm.legend_leave, "legend-close-icon", "./img/close-icon.png");

		d3.selectAll(".legend-text, .legend-instructions").style("font-size", 0.018*onimm.vars.width+"px");

		onimm.legend_leave.on("click", function(d) {
			onimm.close_legend();
			onimm.set_legend_helper();
		});
	};

	/**
	 * Set element of historic
	 *
	 */
	onimm.set_historic = function() {
		onimm.container_historic = onimm.svg.append("svg:g")
			.attr("transform", "translate("+-0.5*onimm.vars.width+",0)")
			.attr("class", "historic-container");

		onimm.historic_image = onimm.createForeignObject(
			onimm.container_historic, 
			"historic-image", 
			onimm.geo.historic.icon.width,
			onimm.geo.historic.icon.height,
			onimm.geo.historic.icon.x,
			onimm.geo.historic.icon.y
		);
		onimm.createImg(onimm.historic_image, "historic-image", "./img/historic-icon.png");

		onimm.historic_title = onimm.container_historic.append("svg:foreignObject")
			.attr("class", "historic-title-foreignObject")
			.attr("width", onimm.geo.historic.title.width)
			.attr("height", onimm.geo.historic.title.height)
			.attr("x", onimm.geo.historic.title.x)
			.attr("y", onimm.geo.historic.title.y)
			.append("xhtml:body").attr("class", "historic-title-body")
				.html(function(d,i) {
					return "<p class='historic-title'>Historique</p>";
				});

		// helper
		onimm.get_historic = onimm.svg.append("svg:g")
			.attr("transform", "translate("+-0.25*onimm.vars.width+",0)")
			.attr("class", "get-historic-container");

		onimm.historic_image = onimm.createForeignObject(
			onimm.get_historic, "get-historic-image",
			onimm.geo.historic.icon.width, 
			onimm.geo.historic.icon.height, 
			onimm.geo.historic.icon.x, 
			onimm.geo.historic.icon.y
		);
		onimm.createImg(onimm.historic_image, "get-historic-image", "./img/historic-icon.png");

		onimm.get_historic_title = onimm.get_historic.append("svg:foreignObject")
			.attr("class", "get-historic-title-foreignObject")
			.attr("width", onimm.geo.historic.title.width)
			.attr("height", onimm.geo.historic.title.height)
			.attr("x", onimm.geo.historic.title.x)
			.attr("y", onimm.geo.historic.title.y)
			.append("xhtml:body").attr("class", "get-historic-title-body")
				.html(function(d,i) {
					return "<p class='get-historic-title'>Historique</p>";
				});

		onimm.get_helper_historic = function() {
			onimm.container_historic.transition().duration(500).attr("transform", "translate("+-0.25*onimm.vars.width+",0)");
			onimm.get_historic.transition().duration(500).attr("transform", "translate("+-0.5*onimm.vars.width+",0)");

			onimm.historic_title.on("click", function() {
				onimm.remove_helper_historic();
			});
		};

		onimm.remove_helper_historic = function() {
			onimm.container_historic.transition().duration(500).attr("transform", "translate("+-0.5*onimm.vars.width+",0)");
			onimm.get_historic.transition().duration(500).attr("transform", "translate("+-0.25*onimm.vars.width+",0)");
		};

		onimm.get_historic.on("click", function() {
			onimm.get_helper_historic();
		});

	};

	onimm.close_legend = function() {
		onimm.container_legend.remove();
	};

	onimm.close_historic = function() {
		onimm.container_historic.remove();
	};

	onimm.set_legend_helper = function() {
		onimm.help_legend_container = onimm.svg.append("svg:g").attr("class", "help");
		onimm.help_legend = onimm.help_legend_container.append("svg:foreignObject")
			.attr("class", "help-text-foreignObject")
			.attr("width", 0.065*onimm.vars.width)
			.attr("height", 0.085*onimm.vars.height)
			.attr("x", 0.90*onimm.vars.width)
			.attr("y", 0.05*onimm.vars.half_height)
			.append("xhtml:body").attr("class", "help-text-body")
				.html(function(d,i) {
					return "<p class='help-text-legend'>Aide</p>";
				});

		// Set legend again when clicking on help
		onimm.help_legend.on("click", function(d) {
			onimm.help_legend_container.remove();
			onimm.set_legend();
		});
	};

	/**
	 * Add g svg elements for each jobs visited, since the first,
	 * with click handler.
	 */
	onimm.update_historic = function(new_met_id) {

		onimm.hist_nodes = onimm.container_historic.selectAll(".hist-nodes")
			.data(onimm.vars.historic);

		onimm.hist_nodes = onimm.hist_nodes.enter().append("svg:g")
			.classed("hist-nodes", function(d) {return d;})
			.attr("hist", function(d,i) {return i;});

		onimm.hist_nodes.append("svg:circle")
			.attr("class", "hist-circle")
			.attr("r", 0.5*onimm.vars.radius_hist_job)
			.attr("cx", function(d,i) {
				return 0.3*onimm.vars.width;
			})
			.attr("cy", function(d,i) {
				return 0.05*onimm.vars.height + 1.5*onimm.vars.historic[i]["y"];
			})
			.attr("met_domaine", function(d,i) {
				return onimm.vars.historic[i]["met_domaine"];
			})
			.attr("met_id", function(d,i) {
				return onimm.vars.historic[i]["met_id"];
			})
			.style("fill", function(d,i) {
				return onimm.vars.historic[i]["stroke_color"];
			});

		onimm.text_hist_nodes = onimm.hist_nodes.append("svg:foreignObject")
			.attr("class", "hist-nodes-foreignObject")
			.attr("width", 0.2*onimm.vars.width)
			.attr("height", 0.13*onimm.vars.height)
			.attr("x", function(d,i) {
				return 0.29*onimm.vars.width;
			})
			.attr("y", function(d,i) {
				return 0.0165*onimm.vars.height + 1.5*onimm.vars.historic[i]["y"];
			})
			.attr("met_domaine", function(d,i) {
				return onimm.vars.historic[i]["met_domaine"];
			})
			.attr("met_id", function(d,i) {
				return onimm.vars.historic[i]["met_id"];
			})
			.append("xhtml:body").attr("class", "hist-nodes-body")
				.html(function(d,i) {
					return "<div class='hist-nodes-div'>"
					+"<p class='hist-nodes-text'>"+d.name+"</p>";
				});

		// font size of all text in historic, without the Title
		d3.selectAll(".hist-nodes-text").style("font-size", onimm.geo.historic.font_size+"px");

		// Set hist-nodes-foreignObject height to be what we need, not more nor less
		var hist_nodes_text_height = [];
		$(".hist-nodes-text").each(function(index, element) {
			hist_nodes_text_height.push(1.2*$(element).outerHeight());
		});
		d3.selectAll(".hist-nodes-foreignObject").attr("height", function(d,i) {
			return hist_nodes_text_height[i];
		});

		d3.selectAll(".hist-nodes-text-body").each(function(d,i) {
			d3.select(this)
				.attr("met_domaine", function(d,i) {
					return onimm.vars.historic[i]["met_domaine"];
				})
				.attr("met_id", function(d,i) {
					return onimm.vars.historic[i]["met_id"];
				});
		});

		// Set bold style for the current jobs/nodes we are displaying at the center
		d3.selectAll(".hist-nodes-body").each(function(d,i) {
			if (d.met_id == met_id) {
				d3.select(this).style("font-weight", "bold");
			}
		});

		// Click on historic node will change the central node
		onimm.hist_nodes.on("click", function(d,i) {

			d3.selectAll(".bonds-container").transition().duration(200)
				.style("opacity", 0);

			d3.selectAll(".jobs").transition().duration(750)
				.attr("transform", function(d,i) {
					return "translate("+onimm.vars.x_coordinates[i]+","+onimm.vars.y_coordinates[i]+")";
				});

			// Change node with historic
			$(".onimm-svg").fadeOut(1000, function() {
				$(".onimm-svg").remove();
				Onimm("onimm", d.met_id, "./data/carte_heuristique.xml", onimm.vars.historic);
			});
		});

	};

	/**
	 *  Display info about the central jobs we click on.
	 *  Prevent other click and do some animation
	 */
	onimm.display_info_job = function(d, i , data) {

		d3.select(".bubble-info-icon").on("click", function() {});

		d3.selectAll(".historic-container").transition().duration(200)
			.style("opacity", 0);

		d3.selectAll(".other-jobs-container").transition().duration(200)
			.style("opacity", 0);

		d3.selectAll(".jobs-container").transition().duration(200)
			.style("opacity", 0.5);

		d3.selectAll(".bonds-container").transition().duration(200)
			.style("opacity", 0.1);


		var content = "";

		// The content will be build progressively
		for (var j = 0, l = data[i].Thesaurus.CSTM_T.record.length; j<l; j++) {
			if (data[i].MET_DOMAINE["#text"] === data[i].Thesaurus.CSTM_T.record[j].DKEY["#text"]) {
				onimm.info_job = onimm.svg.append("svg:g").attr("class","info-job-container").append("svg:foreignObject");

				d3.select(".info-job-container").attr("transform", "translate("+0+","+0.5*onimm.vars.half_height+")");

				onimm.info_job.transition()
					.duration(1000).ease('linear')
					.attr("class","info-job-foreignObject")
					.attr("width", onimm.geo.info_job.width)
					.attr("height", onimm.geo.info_job.height)
					.attr("x", onimm.geo.info_job.x)
					.attr("y", onimm.geo.info_job.y);

				onimm.info_job
					.append("xhtml:body").attr("class", "info-job-body")
					.append("div")
					.attr("class", "info-job")
					.html("<div class='info-close'><img class='info-close-icon' src='./img/close-icon.png'></div>"
						+"<p class='info-job-title'>Informations</p>"
						+"<p class='info-job-text'>Métier ayant une "+data[i].Thesaurus.CSTM_T.record[j].CSLABELFLD["#text"]+".</p>");
			}
		}

		content = d3.select(".info-job").html();
			d3.select(".info-job").html(content
				+"<p class='info-job-text'><em>Statut</em> : ");

		for (var k = 0, m = data[i].Thesaurus.CSTM_T.record.length; k<m; k++) {
			if (data[i].Thesaurus.CSTM_T.record[k].MFR["#text"] == "Statut") {
				content = d3.select(".info-job").html();
				d3.select(".info-job").html(content
					+data[i].Thesaurus.CSTM_T.record[k].CSLABELFLD["#text"] + "  ");
			}
		}

		content = d3.select(".info-job").html();
		d3.select(".info-job").html(content
			+"<p class='info-job-text'><em>Niveaux d'étude</em> : "+data[i].Niveaux_d_étude_requis.NIVEAU_ETUDE.record.CSLABELFLD["#text"]+"</p>");

		var centre_interets = data[i].MET_CENTRE_INTERET["#text"].split("/");

		content = d3.select(".info-job").html();
		d3.select(".info-job").html(content
			+"<p class='info-job-text'><em>Intérêt(s)</em> : </p><p class='info-job-text-interet'>");

		for (var v = 0 , q = data[i].Thesaurus.CSTM_T.record.length; v<q; v++) {
			for (var u = 0, p = centre_interets.length; u<p; u++) {
				if (centre_interets[u] == data[i].Thesaurus.CSTM_T.record[v].DKEY["#text"]) {
					content = d3.select(".info-job-text-interet").html();
					d3.select(".info-job-text-interet").html(content
						+data[i].Thesaurus.CSTM_T.record[v].CSLABELFLD["#text"]+"  ");
				}
			}
		}

		content = d3.select(".info-job").html();
		d3.select(".info-job").html(content);

		content = d3.select(".info-job").html();
		d3.select(".info-job").html(content
			+"<p class='info-job-more'>Cliquez ici pour "
			+"<a target='_blank' href='http://www.onisep.fr/http/redirection/metier/identifiant/"+data[i].MET_ID['#text']+"'>en savoir plus</a></p>");

		d3.selectAll(".info-job-foreignObject")
			.attr("height", 0.1*$(".info-job").outerHeight());

		d3.select(".info-close").on("dblclick", function() {});

		d3.select(".info-close").on("click", function() {
			onimm.close_modale_window();
		});

		d3.select(".bubble-info-icon").on("dblclick", function() {});

		d3.select(".bubble-info-icon").on("click", function() {
			onimm.close_modale_window();
		});

		onimm.vars.drag_modale = d3.behavior.drag()
			.on("dragstart", onimm.dragstarted)
			.on("drag", onimm.dragged_modale)
			.on("dragend", onimm.dragended);

		d3.select(".info-job-container").call(onimm.vars.drag_modale);

	};

	onimm.close_modale_window = function() {
		d3.select(".info-job-container").remove();

			d3.selectAll(".jobs-container").transition().duration(200)
				.style("opacity", 1);

			d3.selectAll(".bonds-container").transition().duration(200)
				.style("opacity", 1);


			d3.selectAll(".historic-container").transition().duration(400)
				.style("opacity", 1);

			d3.selectAll(".other-jobs-container").transition().duration(400)
				.style("opacity", 1);

			d3.select(".bubble-info-icon").on("click", function(d,i) {
				onimm.display_info_job(d, i, onimm.vars.data);
			});

	};


	onimm.display_statut = function(i, data) {
		var content = "";

		onimm.info_job = onimm.svg.append("svg:g").attr("class","info-job-container").append("svg:foreignObject");

		d3.select(".info-job-container").attr("transform", "translate("+0+","+0.5*onimm.vars.half_height+")");

		onimm.info_job.transition()
			.duration(1000).ease('linear')
			.attr("class","info-job-foreignObject")
			.attr("width", 500).attr("height", 280)
			.attr("x", 0.0625*onimm.vars.width)
			.attr("y", -0,25*onimm.vars.height);

		onimm.info_job
			.append("xhtml:body").attr("class", "info-job-body")
			.append("div")
			.attr("class", "info-job")
			.html("<div class='info-close'><img class='info-close-icon' src='./img/close-icon.png'></div>");


		for (var k = 0, m = data[i].Thesaurus.CSTM_T.record.length; k<m; k++) {
			if (data[i].Thesaurus.CSTM_T.record[k].MFR["#text"] == "Statut") {

				content = d3.select(".info-job").html();
				d3.select(".info-job").html(content
					+"<p class='info-job-text'><em>Statut</em> : "+data[i].Thesaurus.CSTM_T.record[k].CSLABELFLD["#text"]+"</p>");
			}
		}

		d3.select(".info-close").on("dblclick", function() {});

		d3.select(".info-close").on("click", function() {
			onimm.close_modale_window();
		});

		d3.select(".bubble-info-icon").on("dblclick", function() {});

		d3.select(".bubble-info-icon").on("click", function() {
			onimm.close_modale_window();
		});

		onimm.vars.drag_modale = d3.behavior.drag()
			.on("dragstart", onimm.dragstarted)
			.on("drag", onimm.dragged_modale)
			.on("dragend", onimm.dragended);

		d3.select(".info-job-container").call(onimm.vars.drag_modale);

	};

	/**
	 * Initiate the jobs position with coordinates from polar
	 * @param  {integer} i zero-based index of element
	 * @return {float} x coordinates
	 */
	onimm.init_x_coordinates = function(d,i) {
		var x_coordinates = 0;

		if(d.MET_ID["#text"] === met_id) {
			onimm.vars.isNodeCentralX = true;
			return x_coordinates;
		}
		else if (d.MET_ID["#text"] !== met_id && false === onimm.vars.isNodeCentralX) {
			x_coordinates = 0.4*(onimm.vars.height*Math.cos((i)*(2*Math.PI)/(onimm.vars.totalNodes - 1)));
			return x_coordinates;
		}
		else if (d.MET_ID["#text"] !== met_id && true === onimm.vars.isNodeCentralX) {
			x_coordinates = 0.4*(onimm.vars.height*Math.cos((i-1)*(2*Math.PI)/(onimm.vars.totalNodes - 1)));
			return x_coordinates;
		}
	};
	onimm.init_y_coordinates = function(d,i) {
		var y_coordinates = 0;

		if(d.MET_ID["#text"] === met_id) {
			onimm.vars.isNodeCentralY = true;
			return y_coordinates;
		}
		else if (d.MET_ID["#text"] !== met_id && false === onimm.vars.isNodeCentralY) {
			y_coordinates = 0.3*(onimm.vars.height*Math.sin((i)*(2*Math.PI)/(onimm.vars.totalNodes - 1)));
			return y_coordinates;
		}
		else if (d.MET_ID["#text"] !== met_id && true === onimm.vars.isNodeCentralY) {
			y_coordinates = 0.3*(onimm.vars.height*Math.sin((i-1)*(2*Math.PI)/(onimm.vars.totalNodes - 1)));	
			return y_coordinates;
		}
	};

	/** 
	 * Create bonds with color, marker, text
	 */
	onimm.init_bonds = function(data) {
		
		// set bonds coordinates and load array
		onimm.bonds = [];
		for (var a = 0, l = onimm.vars.totalNodes; a<l; a++) {
			if (data[a].MET_ID["#text"] !== met_id){
				onimm.bonds[a] = onimm.bond_container.append("path")
					.attr("class", function(d,i) {return "bond"})
					.attr("id", function(d,i) {return "bond-"+a})
					.attr("num", function(d,i) {return a})
					.attr("met_id", function(d,i) {return data[a].MET_ID["#text"]})
					.attr("fill", "none").attr("stroke-width", "5").attr("stroke", "none")
					.attr("d", "M 0,0 0,0 0,0 "+1.1*onimm.vars.x_coordinates[a]+","+1.1*onimm.vars.y_coordinates[a]+"");
			}
			else {		
				onimm.bonds[a] = onimm.bond_container.append("path")
					.attr("class", function(d,i) {return "is-active-bond"})
					.attr("id", function(d,i) {return "bond_"+a})
					.attr("num", function(d,i) {return a})
					.attr("met_id", function(d,i) {return data[a].MET_ID["#text"]})
					.attr("fill", "none").attr("stroke-width", "5").attr("stroke", "none")
					.attr("d", "M 0,0 0,0 0,0 "+1.1*onimm.vars.x_coordinates[a]+","+1.1*onimm.vars.y_coordinates[a]+"")
				
				// For active node, we get the data
				onimm.vars.coordinated = data[a].Liens_metiers_supervise;
				onimm.vars.is_coordinated = data[a].Liens_metiers_est_supervise;
				onimm.vars.collaboration = data[a].Liens_metiers_collabore;

				// The circle must be a little bit larger
				d3.select(".jobs-circle").attr("r", onimm.vars.radius_job+10);
				onimm.jobs.attr("class", function(d,i) { 
					if (i==0) {
						return "is-active-jobs is-draggable jobs";
					}
					else return "is-draggable jobs";
				});
				
				d3.select(".bubble-foreignObject")
					.attr('width', function(d,i) {
						if (i==0) {
							return 2*onimm.vars.radius_job+20;
						}
					})
					.attr('height', function(d,i) {
						if (i==0) {
							return 2*onimm.vars.radius_job+20;
						}
					})
					.attr('x', function(d,i) {
						if (i==0) {
							return -onimm.vars.radius_job-10;
						}
					})
					.attr('y', function(d,i) {
						if (i==0) {
							return -onimm.vars.radius_job-10;
						}
					});
			}
		}
 

		// Set the right color of the bond, based on the xml loaded. See its structure for help
		for (var b = 0, le = onimm.vars.totalNodes; b<le; b++) {

			if (onimm.bonds[b].classed("is-active-bond", true)) {
				// Since the record in xml may be an array we have to test
				if (onimm.vars.coordinated.METIER.record != undefined) {
					if ($.isArray(onimm.vars.coordinated.METIER.record)) {
						for (var j = 0, l = onimm.vars.coordinated.METIER.record.length; j<l ; j++) {
							if (data[b].MET_ID["#text"] == onimm.vars.coordinated.METIER.record[j].MET_MET_ID['#text']) {
								onimm.bonds[b].attr("stroke", onimm.vars.coordination_color)
									//.attr("stroke-dasharray", "5,17")
									.attr("marker-end", "url(#coordination)");

								onimm.bonds[b].attr("class","is-active-bond coordination");
							}
						}
					}
					else {
						if (data[b].MET_ID["#text"] == onimm.vars.coordinated.METIER.record.MET_MET_ID['#text']) {
							onimm.bonds[b].attr("stroke", onimm.vars.coordination_color)
								//.attr("stroke-dasharray", "5,17")
								.attr("marker-end", "url(#coordination)");

							onimm.bonds[b].attr("class","is-active-bond coordination");
						}
					}
				}

				if (onimm.vars.is_coordinated.METIER.record != undefined) {
					if ($.isArray(onimm.vars.is_coordinated.METIER.record)) {
						for (var j = 0, l = onimm.vars.is_coordinated.METIER.record.length; j<l; j++) {
							if (data[b].MET_ID["#text"] == onimm.vars.is_coordinated.METIER.record[j].MET_MET_ID['#text']) {
								onimm.bonds[b].attr("stroke", onimm.vars.coordination_color)
									//.attr("stroke-dasharray", "5,17")
									.attr("marker-end", "url(#coordinated)");

								onimm.bonds[b].attr("class","is-active-bond coordinated");
							}
						}
					}
					else {
						if (data[b].MET_ID["#text"] == onimm.vars.is_coordinated.METIER.record.MET_MET_ID['#text']) {
							onimm.bonds[b].attr("stroke", onimm.vars.coordination_color)
								//.attr("stroke-dasharray", "5,17")
								.attr("marker-end", "url(#coordinated)");

							onimm.bonds[b].attr("class","is-active-bond coordinated");
						}
					}	
				}

				if (onimm.vars.collaboration.METIER.record != undefined) {
					if ($.isArray(onimm.vars.collaboration.METIER.record)) {
						for (var j = 0, l = onimm.vars.collaboration.METIER.record.length; j<l; j++) {
							if (data[b].MET_ID["#text"] == onimm.vars.collaboration.METIER.record[j].MET_MET_ID['#text']) {
								onimm.bonds[b].attr("stroke", onimm.vars.collaboration_color)
								//.attr("stroke-dasharray", "5,17");
							}
						}
					}
					else {
						if (data[b].MET_ID["#text"] == onimm.vars.collaboration.METIER.record.MET_MET_ID['#text']) {
							onimm.bonds[b].attr("stroke", onimm.vars.collaboration_color)
							//.attr("stroke-dasharray", "5,17");
						}
					}
				}
			}// end if isActive
		}// end for
	};

	/**
	 * Changing to other node
	 * @param  d3.selection d the previous clicked node
	 * @param  integer i the number of the element
	 * @param  big json data onimm.vars.data from xml
	 */
	onimm.move_to_node = function(e,j,data) {
		if (j != 0 ) {

			onimm.jobs.on("click", function(d,i) {});

			var node_hist = {
				name : e.CSLABELFLD["#text"],
				met_id : e.MET_ID["#text"],
				met_domaine : e.MET_DOMAINE["#text"],
				stroke_color :  onimm.init_color_node(e),
				stroke_colors : onimm.vars.stroke_color,
				x : 0.025*onimm.vars.width,
				y : 0.0333*onimm.vars.height + 30*onimm.vars.historic.length
			};

			onimm.vars.historic.push(node_hist);

			d3.selectAll(".bonds-container").transition().duration(200)
				.style("opacity", 0);

			d3.selectAll(".jobs").transition().duration(750)
				.attr("transform", function(d,i) {
					return "translate("+onimm.vars.x_coordinates[i]+","+onimm.vars.y_coordinates[i]+")";
				});

			// Change node with historic
			$(".onimm-svg").fadeOut(1000, function() {
				$(".onimm-svg").remove();
				Onimm("onimm", e.MET_ID["#text"], "./data/carte_heuristique.xml", onimm.vars.historic);
			});
		}
	};

	// create foreignObject easily
	onimm.createForeignObject = function(container, name, width, height, x, y) {

		onimm[""+name] = container.append("svg:foreignObject")
			.attr("class", name+"-foreignObject")
			.attr("width", width)
			.attr("height", height)
			.attr("x", x)
			.attr("y", y)
			.append("xhtml:body").attr("class", name+"-body");

		return onimm[""+name];
	};

	// create img easily for svg foreignObject
	onimm.createImg = function(container, name, url) {
		container.html("<img class='"+name+"' src='"+url+"'>");
		return container;
	};

	/* http://stackoverflow.com/questions/7769829/tool-javascript-to-convert-a-xml-string-to-json
	 * var jsonText = JSON.stringify(xmlToJson(xmlDoc)); 
	 * with xmlDoc an xml dom document 
	 */
	onimm.xmlToJson = function(xml) {
		var obj = {};
		if (xml.nodeType == 1) {
			if (xml.attributes.length > 0) {
				obj["attributes"] = {};
				for (var j = 0; j < xml.attributes.length; j++) {
					var attribute = xml.attributes.item(j);
					obj["attributes"][attribute.nodeName] = attribute.nodeValue;
				}
			}
		} else if (xml.nodeType == 3) { 
			obj = xml.nodeValue;
		}
		if (xml.hasChildNodes()) {
			for (var i = 0; i < xml.childNodes.length; i++) {
				var item = xml.childNodes.item(i);
				var nodeName = item.nodeName;
				if (typeof (obj[nodeName]) == "undefined") {
					obj[nodeName] = onimm.xmlToJson(item);
				} else {
					if (typeof (obj[nodeName].push) == "undefined") {
						var old = obj[nodeName];
						obj[nodeName] = [];
						obj[nodeName].push(old);
					}
					obj[nodeName].push(onimm.xmlToJson(item));
				}
			}
		}
		return obj;
	}

	// Let it go, let it go!
	onimm.init();

	return onimm;
};
