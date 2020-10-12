/**
 * @author Ahmed Salah
 * @create date 2019-09-01 23:44:47
 * @modify date 2019-09-01 23:44:47
 * @desc [Show Map data utilizing leaflet js & other plugins & resources APIs]
 */

// import needed modules
import "@fortawesome/fontawesome-free/css/solid.min.css";
import "@fortawesome/fontawesome-free/css/fontawesome.min.css";

import "@fortawesome/fontawesome-free/js/solid";
import "@fortawesome/fontawesome-free/js/fontawesome.min.js";

import "bootstrap/dist/css/bootstrap.min.css";

import "leaflet/dist/leaflet.css";
import L from "leaflet/dist/leaflet.js";

import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw/dist/leaflet.draw";

import "leaflet-sidebar-v2/css/leaflet-sidebar.min.css";
import "leaflet-sidebar-v2/js/leaflet-sidebar.min.js";

import "./assets/css/styles.css";

// work around for leaflet images not showing
// https://github.com/PaulLeCam/react-leaflet/issues/453#issuecomment-410450387
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});


// L.Icon.Default.imagePath = "leaflet/dist/images/";

/**
 * Map constructor
 *
 * @param {*} mapSelector
 * @param {*} marker
 */
function QiamMap(mapSelector, marker) {
    this.mapSelector = (mapSelector && mapSelector !== undefined ? mapSelector : "mapid");
    this.map = this;
    this.defaultLatlng = [25.0, 41.0];
    this.zoom = 5;
    this.scale = 0;
    this.tile = "";
    this.mabBoxTile = 
    this.greenMarker = new L.Icon({
        iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
    this.marker = (marker
    ? marker
    : L.marker(this.defaultLatlng, { riseOnHover: true, draggable: true, icon: this.greenMarker })
    );
    this.popup = L.popup();
    this.popupTemp = '';
    this.rectangle = [];
    this.circle = [];
    this.drawBar = {};
    this.sidebar = {};
    this.panels = [];
    this.panelTimeout = 1200;
}

// creat the map
QiamMap.prototype.createMap = function() {
    var map = L.map(this.mapSelector, /*{drawControl: true}*/).setView(this.defaultLatlng, this.zoom);
    this.map = map;
    this.tile = this.addTile();
    this.marker = this.addMarker(this.defaultLatlng, {icon: this.greenMarker, riseOnHover: true, draggable: true });
    this.scale = this.addScale();

    return map;
};

/**
 * add tile
 *
 * @param {*} Url
 * @param {*} Options
 * @returns
 */
QiamMap.prototype.addTile = function(Url, Options) {
    // http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
    // http://tile.stamen.com/terrain/{z}/{x}/{y}.jpg
    // 
  var /*mapBoxUrl = "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        mapBoxOptions = {
          attribution:
            ' | Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
          maxZoom: 18,
          id: "mapbox.streets"
          // accessToken: "your.mapbox.access.token"
        },*/
        osmUrl = "http://{s}.tile.osm.org/{z}/{x}/{y}.png",
        osmOptions = {
          attribution:
            '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
          id: "mapbox.streets"
          // accessToken: "your.mapbox.access.token"
        },
        stamenUrl = Url ? Url : "http://tile.stamen.com/terrain/{z}/{x}/{y}.jpg",
        stamenOptions = Options
        ? Options
        : {
            attribution:
            'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>',
            maxZoom: 18,
            // accessToken: "your.mapbox.access.token"
            },
        tiles = [];

        // tiles.push(
        //     {openStreetMapBox: L.tileLayer(mapBoxUrl, mapBoxOptions).addTo(this.map)},
        //     {stamen: L.tileLayer(stamenUrl, stamenOptions).addTo(this.map)}
        //     );

        // for (let tile in tiles) {
        //     L.control.layers().addBaseLayer(tile);
        // }

        L.control.layers({
            "<span>Stamen Terrain</span>": L.tileLayer(stamenUrl, stamenOptions).addTo(this.map),
            // "<span>MapBox</span>": L.tileLayer(mapBoxUrl, mapBoxOptions).addTo(this.map),
            "<span>OSM</span>": L.tileLayer(osmUrl, osmOptions).addTo(this.map),
        }, null, {position: 'topright'}).addTo(this.map);

  return {tiles};
};

// add scale
QiamMap.prototype.addScale = function(){
    return L.control.scale().addTo(this.map);
};

/**
 * side bar panel template
 *
 * @param {*} title
 * @param {*} content
 * @param {*} image
 * @returns
 */
QiamMap.prototype.sidebarPanelTemplate = function(title, content, image, distance){

    var temp = `<div class="card w-100 mb-3">
                    ${
                        image ? `<img src="${image}" class="card-img-top" alt="${image}" style="
                        max-height: 200px;
                        ">` : ``
                    }
                    <ul class="list-group list-group-flush">
                    ${ title ? 
                        `<div class="list-group-item d-flex justify-content-between align-items-center flex-wrap p-2">
                            <strong>Region </strong><span>${title}</span>
                        </div>` : ``
                    }
                    ${ content ? 
                        `<div class="list-group-item d-flex justify-content-between align-items-center flex-wrap p-2">
                            <strong>Lat-Lng </strong><span>${content}</span>
                        </div>` : ``
                    }
                    ${ distance ? 
                        `<div class="list-group-item d-flex justify-content-between align-items-center flex-wrap p-2">
                            <strong>Distance </strong><span>${distance}</span>
                        </div>` : ``
                    }
                    </ul>
                </div>`;

    return temp;

};

// add draw toolbar
QiamMap.prototype.addDrawToolBar = function(){
      //create drawing toolbar

    var editableLayers = new L.FeatureGroup();
    this.map.addLayer(editableLayers);

    // var MyCustomMarker = L.Icon.extend({
    //     options: {
    //         shadowUrl: null,
    //         iconAnchor: new L.Point(12, 12),
    //         iconSize: new L.Point(24, 24),
    //         iconUrl: 'link/to/image.png'
    //     }
    // });

    var options = {
        // position: 'topright',
        draw: {
            polyline: {
                shapeOptions: {
                    color: '#f357a1',
                    weight: 10
                }
            },
            polygon: {
                allowIntersection: false, // Restricts shapes to simple polygons
                drawError: {
                    color: '#e1e100', // Color the shape will turn when intersects
                    message: '<strong>Oh snap!<strong> you can\'t draw that!' // Message that will show when intersect
                },
                shapeOptions: {
                    color: '#bada55'
                }
            },
            circle: true, // Turns on this drawing tool
            circlemarker: false,
            rectangle: {
                shapeOptions: {
                    clickable: false
                }
            },
            // marker: {
            //     icon: new MyCustomMarker()
            // }
        },
        edit: {
            featureGroup: editableLayers, //REQUIRED!!
            edit: false,
            remove: true
        }
    };

    var drawControl = new L.Control.Draw(options);
    this.map.addControl(drawControl);


    this.map.on(L.Draw.Event.CREATED, function (e) {
        // console.log("draw event created: ", e);
        var type = e.layerType,
            layer = e.layer;

        if(type === 'marker') this.onMarkerDraw(layer, editableLayers, type);
        // if(type === 'circle') this.onCircleDraw(layer, editableLayers, type);
        // if(type === 'rectangle') this.onRectangleDraw(layer, editableLayers, type);
        // if(type === 'polygon') this.onRectangleDraw(layer, editableLayers, type); // for now..
        else if(type === 'polyline') this.onPolylineDraw(layer, editableLayers, type);
        else this.onShapeDraw(layer, editableLayers, type);


    }.bind(this));

    return editableLayers;
};


// marker tool action
QiamMap.prototype.onMarkerDraw = function(layer, editableLayers){

    if(!layer) return;

    var latlng = [],
        center = {},
        view = "",
        data = {};

    editableLayers.addLayer(layer);

    // get specified intented panel to show info into
    var infoPanel = this.sidebar._panes.filter(panel => panel.id == 'point-info')[0];


    latlng = layer.getLatLng();
    data = this.fetchAreaCoors(latlng);

    data.then(resp => {
        if(resp){
            //console.log("resp: ", resp);

            view = this.map.flyTo([latlng.lat, latlng.lng-2], this.map.getZoom());

            var regionName = (resp.name ? resp.name : resp.display_name);
            var image = this.fetchLocationImageByName(regionName);
            
            image.then(img => {

                var temp = this.sidebarPanelTemplate(regionName, latlng.lat.toFixed(4) +' , '+ latlng.lng.toFixed(4), !img.noImage ? img : null);
                // this.popupTemp = '<div><strong>Region: </strong>'+ regionName +'</div><div><strong>Lat-Lng: </strong> '+ latlng.lat +' , '+ latlng.lng+'</div>'; 

                layer.bindPopup(temp).openPopup();

                // get panel & remove default non-sense classes
                var classNuki = infoPanel.querySelector('.panel-content');
                classNuki.classList.remove('text-center','text-danger');
                // change panel default content
                classNuki.innerHTML = temp;
                // change panel default title
                infoPanel.querySelector('.leaflet-sidebar-header').childNodes[0].textContent = regionName;
                
                // console.log(this.sidebar, infoPanel, this.sidebar._panes);
                // enable it 
                this.sidebar.enablePanel(infoPanel.id);
                // open it
                var tt = setTimeout( () => { 
                    this.sidebar.open(infoPanel.id);
                    clearTimeout(tt);
                }, this.panelTimeout);

            });// \ if there is image

        }
    });

};

// circle tool action
QiamMap.prototype.onCircleDraw = function(layer, editableLayers){

    if(!layer) return;

    var latlng = [],
        center = {},
        view = "",
        data = {},
        getAround = [];

    editableLayers.addLayer(layer);

    // get specified intented panel to show info into
    var infoPanel = this.sidebar._panes.filter(panel => panel.id == 'point-info')[0];


    latlng = layer.getLatLng();
    data = this.fetchAreaCoors(latlng);

    data.then(resp => {
        if(resp){
            //console.log("resp: ", resp);

            view = this.map.flyTo([latlng.lat, latlng.lng-2], this.map.getZoom());

            var regionName = (resp.name ? resp.name : resp.display_name);
            var image = this.fetchLocationImageByName(regionName);
            
            image.then(img => {

                var temp = this.sidebarPanelTemplate(regionName, latlng.lat.toFixed(4) +' , '+ latlng.lng.toFixed(4), !img.noImage ? img : null);
                // this.popupTemp = '<div><strong>Region: </strong>'+ regionName +'</div><div><strong>Lat-Lng: </strong> '+ latlng.lat +' , '+ latlng.lng+'</div>'; 

                var newMarker = this.addMarkerWithPopup([latlng.lat, latlng.lng], null, temp);

                // add it to editable layers group to be controlled later (e.g remove it);
                editableLayers.addLayer(newMarker);

                // layer.bindPopup(temp).openPopup();

                getAround = this.fetchAreaAround(latlng, layer.getRadius(), '["building"="commercial"]', type);

                if(getAround)
                {
                    // add new generated markers to be editable
                    getAround.then(markers => { 
                        if(markers && markers.length) {
                            markers.forEach(marker => editableLayers.addLayer(marker) );
                        } 
                    });
                }

                // get panel & remove default non-sense classes
                var classNuki = infoPanel.querySelector('.panel-content');
                classNuki.classList.remove('text-center','text-danger');
                // change panel default content
                classNuki.innerHTML = temp;
                // change panel default title
                infoPanel.querySelector('.leaflet-sidebar-header').childNodes[0].textContent = regionName;
                
                // console.log(this.sidebar, infoPanel, this.sidebar._panes);
                // enable it 
                this.sidebar.enablePanel(infoPanel.id);
                // open it
                var tt = setTimeout( () => { 
                    this.sidebar.open(infoPanel.id);
                    clearTimeout(tt);
                }, this.panelTimeout);

            });// \ if there is image

        }
    });

};


// rectangle tool action
QiamMap.prototype.onRectangleDraw = function(layer, editableLayers, type){

    if(!layer) return;

    var latlng = [],
        center = {},
        view = "",
        data = {},
        getAround;

    editableLayers.addLayer(layer);

    // get specified intented panel to show info into
    var infoPanel = this.sidebar._panes.filter(panel => panel.id == 'point-info')[0];


    latlng = layer.getLatLngs();
    center = layer.getCenter();
    data = this.fetchAreaCoors(center);

    data.then(resp => {
        if(resp){

            view = this.map.flyTo([center.lat, center.lng-2], this.map.getZoom());

            var regionName = (resp.name ? resp.name : resp.display_name);
            var image = this.fetchLocationImageByName(regionName);
            
            image.then(img => {

                var temp = this.sidebarPanelTemplate(regionName, center.lat.toFixed(4) +' , '+ center.lng.toFixed(4), !img.noImage ? img : null);

                // this.popupTemp = '<div><strong>Region: </strong>'+(resp.name ? resp.name : resp.display_name) +'</div><div><strong>Lat-Lng: </strong> '+ center.lat +' , '+ center.lng+'</div>';
                // var bounds = [[resp.boundingbox[0], resp.boundingbox[2]], [resp.boundingbox[1], resp.boundingbox[3]]];
                //this.map.removeLayer(this.circle);
                // this.rectangle = L.rectangle(bounds, {color: "#ff7800", weight: 1}).addTo(this.map);
                // this.map.fitBounds(bounds);
                // this.circle = L.circle(layer.getLatLng(), {radius: this.zoom*5000}).addTo(this.map);
                // this.marker.bindPopup(this.popupTemp).openPopup();
                
                // add a marker in the center
                var newMarker = this.addMarkerWithPopup([center.lat, center.lng], null, temp);
                // layer.bindPopup(this.popupTemp).openPopup();
                // add it to editable layers group to be controlled later (e.g remove it);
                editableLayers.addLayer(newMarker);

                getAround = this.fetchAreaAround(latlng, null, '["building"="commercial"]', type);

                if(getAround)
                {
                    // add new generated markers to be editable
                    getAround.then(markers => { 
                        if(markers && markers.length) {
                            markers.forEach(marker => editableLayers.addLayer(marker) );
                        } 
                    });
                }
                // get panel & remove default non-sense classes
                var classNuki = infoPanel.querySelector('.panel-content');
                classNuki.classList.remove('text-center','text-danger');
                // change panel default content
                classNuki.innerHTML = temp;
                // change panel default title
                infoPanel.querySelector('.leaflet-sidebar-header').childNodes[0].textContent = regionName;
                
                // console.log(this.sidebar, infoPanel, this.sidebar._panes);
                // enable it 
                this.sidebar.enablePanel(infoPanel.id);
                // open it
                var tt = setTimeout( () => { 
                    this.sidebar.open(infoPanel.id);
                    clearTimeout(tt);
                }, this.panelTimeout);

            });// \ image end req
        }
    });
};


// rectangle tool action
QiamMap.prototype.onPolylineDraw = function(layer, editableLayers, type){

    if(!layer) return;

    var latlngs = [],
        center = {},
        view = "",
        data = {},
        getAround,
        totalDistance = 0.00000;

    editableLayers.addLayer(layer);

    // get specified intented panel to show info into
    var infoPanel = this.sidebar._panes.filter(panel => panel.id == 'point-info')[0];


    latlngs = layer.getLatLngs();
    center = layer.getCenter();
    
    var firstCoord = latlngs[0];
    var lastCoord = latlngs[latlngs.length-1];
    
    // get distance
    latlngs.forEach(function(latlng, i){
        if(i+1 > latlngs.length-1){
            return;
        }

        totalDistance += latlng.distanceTo(latlngs[i+1]);
    });

    data = this.fetchAreaCoors(lastCoord);

    data.then(resp => {
        if(resp){

            view = this.map.flyTo([lastCoord.lat, lastCoord.lng-2], this.map.getZoom());

            var regionName = (resp.name ? resp.name : resp.display_name);
            var image = this.fetchLocationImageByName(regionName);
            
            image.then(img => {

                var temp = this.sidebarPanelTemplate(regionName, center.lat.toFixed(4) +' , '+ center.lng.toFixed(4), !img.noImage ? img : null, totalDistance.toFixed(2) + ' Meters');

                var firstMarkerTemp = this.sidebarPanelTemplate(null, center.lat.toFixed(4) +' , '+ center.lng.toFixed(4), null, totalDistance.toFixed(2) + ' Meters');
                
                // add a marker in the center
                var firstMarker = this.addMarkerWithPopup([firstCoord.lat, firstCoord.lng], null, firstMarkerTemp);
                var lastMarker = this.addMarkerWithPopup([lastCoord.lat, lastCoord.lng], null, temp);
                // layer.bindPopup(this.popupTemp).openPopup();
                // add it to editable layers group to be controlled later (e.g remove it);
                editableLayers.addLayer(firstMarker);
                editableLayers.addLayer(lastMarker);


                // get panel & remove default non-sense classes
                var classNuki = infoPanel.querySelector('.panel-content');
                classNuki.classList.remove('text-center','text-danger');
                // change panel default content
                classNuki.innerHTML = '<div class="from h5">From <i class="fa fa-map-marker-alt"></i></div> ' + firstMarkerTemp + '<div class="to h5">To <i class="fa fa-map-marked-alt"></i></div> ' + temp;
                // change panel default title
                infoPanel.querySelector('.leaflet-sidebar-header').childNodes[0].textContent = regionName;
                
                // console.log(this.sidebar, infoPanel, this.sidebar._panes);
                // enable it 
                this.sidebar.enablePanel(infoPanel.id);
                // open it
                var tt = setTimeout( () => { 
                    this.sidebar.open(infoPanel.id);
                    clearTimeout(tt);
                }, this.panelTimeout);

            });// \ image end req
        }
    });
};


// general shape tool action
QiamMap.prototype.onShapeDraw = function(layer, editableLayers, type){

    if(!layer) return;

    var latlng = [],
        center = {},
        view = "",
        data = {},
        getAround;

        editableLayers.addLayer(layer);

    // get specified intented panel to show info into
    var infoPanel = this.sidebar._panes.filter(panel => panel.id == 'point-info')[0];


    latlng = type == 'circle' ? 
        layer.getLatLng() : 
        type == 'polygon' ? 
        [layer.getBounds().getSouthWest(), layer.getBounds().getNorthEast()]
        : layer.getLatLngs();
    center = type == 'circle' ? layer.getLatLng() : layer.getCenter();
    data = this.fetchAreaCoors(center);

    data.then(resp => {
        if(resp){

            view = this.map.flyTo([center.lat, center.lng-2], this.map.getZoom());

            var regionName = (resp.name ? resp.name : resp.display_name);
            var image = this.fetchLocationImageByName(regionName);
            
            image.then(img => {

                var temp = this.sidebarPanelTemplate(regionName, center.lat.toFixed(4) +' , '+ center.lng.toFixed(4), !img.noImage ? img : null);

                
                // add a marker in the center
                var newMarker = this.addMarkerWithPopup([center.lat, center.lng], null, temp);
                // layer.bindPopup(this.popupTemp).openPopup();
                // add it to editable layers group to be controlled later (e.g remove it);
                editableLayers.addLayer(newMarker);

                getAround = this.fetchAreaAround(latlng, type == 'circle' ? layer.getRadius() : null, '["building"="commercial"]', type);

                if(getAround)
                {
                    // add new generated markers to be editable
                    getAround.then(markers => { 
                        if(markers && markers.length) {
                            markers.forEach(marker => editableLayers.addLayer(marker) );
                        } 
                    });
                }
                // get panel & remove default non-sense classes
                var classNuki = infoPanel.querySelector('.panel-content');
                classNuki.classList.remove('text-center','text-danger');
                // change panel default content
                classNuki.innerHTML = temp;
                // change panel default title
                infoPanel.querySelector('.leaflet-sidebar-header').childNodes[0].textContent = regionName;
                
                // console.log(this.sidebar, infoPanel, this.sidebar._panes);
                // enable it 
                this.sidebar.enablePanel(infoPanel.id);
                // open it
                var tt = setTimeout( () => { 
                    this.sidebar.open(infoPanel.id);
                    clearTimeout(tt);
                }, this.panelTimeout);

            });// \ image end req
        }
    });
};


// add sidebar to map
QiamMap.prototype.addSideBar = function(){
    var sidebar = L.control.sidebar({
        autopan: true,       // whether to maintain the centered map point when opening the sidebar
        closeButton: true,    // whether t add a close button to the panes
        container: 'sidebar', // the DOM container or #ID of a predefined sidebar container that should be used
        position: 'left',     // left or right
    }).addTo(this.map);

    return sidebar;
};

// add sidebar panel
QiamMap.prototype.addSidebarPanel = function({
    id = 'point-info', 
    icon = '<i class="fa fa-info"></i>', 
    title = 'Info', 
    content = '<div class="text-center text-danger d-flex justify-content-center align-items-start flex-column flex-wrap m-3 panel-content">No content to load..!!</div>', 
    position = 'top'}){ // <id, icon, title, content, position>
    /* add a new panel */
    var panelContent = {
        id: id,                     // UID, used to access the panel
        tab: icon,  // content can be passed as HTML string,
        pane: content,        // DOM elements can be passed, too
        title: title,              // an optional pane header
        position: position                  // optional vertical alignment, defaults to 'top'
    };
    // this.sidebar.addPanel(panelContent);

    this.panels.push(panelContent);
    this.sidebar.addPanel(panelContent);

    // if(this.panels.length){
    //     for (let panel of this.panels) {
    //         this.sidebar.addPanel(panel);
    //     }
    // }

    return panelContent;
};

/**
 * add marker with popup
 *
 * @param {*} latlng
 * @param {*} options
 * @param {*} popupContent
 * @returns
 */
QiamMap.prototype.addMarkerWithPopup = function(latlng, options, popupContent) {
  return L.marker(
    latlng,
    options ? options : { /*riseOnHover: true, draggable: true*/ }
  ).bindPopup(popupContent ? popupContent : "Lat-Lng: " + latlng[0].toFixed(4) +','+ latlng[1].toFixed(4)).addTo(this.map).openPopup();
};

/**
 * add marker
 *
 * @param {*} latlng
 * @param {*} options
 * @returns
 */
QiamMap.prototype.addMarker = function(latlng, options) {
return L.marker(
    latlng,
    options ? options : { riseOnHover: true, draggable: true }
  ).addTo(this.map);
};

/**
 * add popup
 *
 * @param {*} latlng
 * @param {*} content
 * @returns
 */
QiamMap.prototype.addPopup = function(latlng, content) {
  return L.popup()
    .setLatLng([latlng])
    .setContent(content)
    .openOn(this.map);
};

// on map click action
QiamMap.prototype.onMapClick = function(e) {
  console.log("You clicked the map at " + e.latlng, "e: ", e);
//   this.addPopup(e.latlng, "You clicked the map at " + e.latlng.toString());
};

// on map main marker drag action
QiamMap.prototype.onMarkerDrag = function(e) {
    var latlng = this.marker.getLatLng(),
    view = this.map.flyTo([latlng.lat, latlng.lng-2], this.map.getZoom()),
    data = this.fetchAreaCoors(latlng),
    getAround = [];

    // get specified intented panel to show info into
    var infoPanel = this.sidebar._panes.filter(panel => panel.id == 'point-info')[0];

    data.then(resp => {
        if(resp){
            // console.log("resp: ", resp);

            var regionName = (resp.name ? resp.name : resp.display_name);
            var image = this.fetchLocationImageByName(regionName);
            
            this.map.removeLayer(this.circle);
            this.circle = L.circle([latlng.lat, latlng.lng], {radius: this.zoom*5000}).addTo(this.map);
            
            image.then(img => {
                
                var temp = this.sidebarPanelTemplate(regionName, latlng.lat.toFixed(4) +' , '+ latlng.lng.toFixed(4), !img.noImage ? img : null);
                
                
                this.marker.bindPopup(temp).openPopup();
                
                // get panel & remove default non-sense classes
                var classNuki = infoPanel.querySelector('.panel-content');
                classNuki.classList.remove('text-center','text-danger');
                // change panel default content
                classNuki.innerHTML = temp;
                // change panel default title
                infoPanel.querySelector('.leaflet-sidebar-header').childNodes[0].textContent = regionName;
                
                // console.log(this.sidebar, infoPanel, this.sidebar._panes);
                // enable it 
                this.sidebar.enablePanel(infoPanel.id);
                // open it
                var tt = setTimeout( () => { 
                    this.sidebar.open(infoPanel.id);
                    clearTimeout(tt);
                }, this.panelTimeout);

            }); // \ if there is image
        }
    });
};

// on main marker click action
QiamMap.prototype.onMarkerClick = function(e) {
    this.map.off('click', this.onMapClick);
    var latlng = this.marker.getLatLng(),
        view = this.map.flyTo([latlng.lat, latlng.lng-2], this.map.getZoom()),
        data = this.fetchAreaCoors(latlng);

        data.then(resp => {
            if(resp){

                var regionName = (resp.name ? resp.name : resp.display_name);
                var image = this.fetchLocationImageByName(regionName);
                
                image.then(img => {

                    var temp = this.sidebarPanelTemplate(regionName, latlng.lat.toFixed(4) +' , '+ latlng.lng.toFixed(4), !img.noImage ? img : null);
        
                    // this.popupTemp = '<strong>Region: </strong>'+(resp.name ? resp.name : resp.display_name) +'</br/><strong>Lat-Lng: </strong> '+ latlng.lat +' , '+ latlng.lng; 

                    this.marker.bindPopup(temp).openPopup();
                });
            }
        });
};

/**
 * fetch reverse geo
 *
 * @param {*} latlng
 * @param {*} multi
 * @returns
 */
QiamMap.prototype.fetchAreaCoors = async (latlng) => {
    var lat = latlng.lat.toFixed(2),
        lng = latlng.lng.toFixed(2),
        // url = 'https://services.gisgraphy.com/geoloc/search?lat='+ latlng.lat.toFixed(2) +'&lng='+ latlng.lng.toFixed(2) +'&radius=1000&format=json&placetype=restaurant&indent=true';
        url = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&extratags=1&lat='+ lat +'&lon='+ lng;

    var data = await fetch(url)
    .then(resp => resp.json())
    .then(resp => resp)
    .catch(er => er);
    
    // console.log("nominate: ", data);
    
    return data;
};

/**
 * fetch location image from wiki
 *
 * @param {*} locationName
 * @returns
 */
QiamMap.prototype.fetchLocationImageByName = async function(locationName){
    if(!locationName) return;
    // wiki end point examples
    // https://en.wikipedia.org/w/api.php?action=query&prop=images&titles=Albert%20Einstein&format=json&origin=*
    // https://en.wikipedia.org/w/api.php?action=query&titles=File:riyadh.jpg&prop=imageinfo&iiprop=url&format=json&origin=*
    
    // other services
    // https://api.teleport.org/api/urban_areas/slug:riyadh/images/

    // prepare query
    var str = locationName.replace(/\,/gim, '').replace(/\s{2,}/gim, ' ').split(' '),
        q = str/*.length >= 2 ? [str[0], str[1]]*/.join(' ')/* : str[0]*/,
        imgFile = '';

    var imgsEndPoint = `https://en.wikipedia.org/w/api.php?action=query&prop=images&titles=${q}&format=json&origin=*`;


    // var imgEndPoint = `https://api.teleport.org/api/urban_areas/slug:${str.length >= 2 ? [str[0], str[1]].join(' ') : str[0]}/images/`;
    
    // for teleport service
    // var headers = {
        //     mode: 'no-cors', 
        //     headers: {
    //         Accept: 'application/vnd.teleport.v1+json'
    //         // 'Content-Type': 'application/json',
    //         // 'Content-Type': 'application/x-www-form-urlencoded',
    //     }
    // }
    
    var data1 = await fetch(imgsEndPoint).then(resp => resp.json()).then(resp => resp).catch(er => er);
    
    // handel first img list resp
    if(data1 && data1.query && data1.query.pages){
        // usually no more than 1 key in this obj, so get 1st key
        let p = data1.query.pages[''+Object.keys(data1.query.pages)[0]+''];
        if(p.images && p.images.length){
            // get img which contains query text
            let img = p.images.filter(img => img.title.search(q) > -1);
            // get first 1, if no img contains q txt 
            imgFile = img.length ? img[0].title : /*p.images.length > 1 ? p.images[1].title :*/ p.images[0].title;
        }
        else{
            return {noImage: true};//"No Image available for this location";
        }
    }
    else{
        return {noImage: true};//"No Image available for this location";
    }
    
    var imgEndPoint = `https://en.wikipedia.org/w/api.php?action=query&titles=${imgFile}&prop=imageinfo&iiprop=url&format=json&origin=*`;

    var data2 = await fetch(imgEndPoint).then(resp => resp.json()).then(resp => resp).catch(er => er);
    
    // // wiki handle
    if(data2 && data2.query && data2.query.pages){
        let p = data2.query.pages[''+Object.keys(data2.query.pages)[0]+''];
        if(p.imageinfo && p.imageinfo.length){
            return p.imageinfo[0].url;
        }
        else{
            return {noImage: true};//"No Image available for this location";
        }
    }
    else{
        return {noImage: true};//"No Image available for this location";
    }

    // teleport handle
    // if(data && data.photos && data.photos.length){
    //     return data.photos[0].image ? data.photos[0].image.mobile : {noImage: true};//"No Image available for this location";
    // }
    // else{
    //     return {noImage: true};//"No Image available for this location";
    // }


};

/**
 * fetch area around
 *
 * @param {*} currentLatlng [lat, lng] <array>|{lat,lng} coords object
 * @param {*} radius [meters] <string>
 * @param {*} areaType [tag] e.g ["amenity"="market"] <string>
 * @param {*} coorsType [circle, rect, etc..] <string>
 * @param {*} popUpTemplate [string template] <string>
 * @returns
 */
QiamMap.prototype.fetchAreaAround = async function(currentLatlng, radius, areaType, coorsType, popUpTemplate) {
    if(!currentLatlng && radius && areaType) return;

    // fetch around area
    /*
        Find trees 100m around a given location:

        [out:json];
        node
        (around:100.0,lat,lon)
        ["natural"="tree"];
        out;
    */

        let markers = [],
            // if radius specified
            rad = radius ? `around:${radius},` : coorsType == `circle` ? `around:10000,` : ``,
            // swap coors for some shape to work with overpass api
            drawTypeCoors = coorsType == 'polygon' ? 
                `${currentLatlng[0].lat},${currentLatlng[0].lng},${currentLatlng[1].lat},${currentLatlng[1].lng}` :
                coorsType == 'rectangle' ? 
                `${currentLatlng[0][0].lat},${currentLatlng[0][0].lng},${currentLatlng[0][2].lat},${currentLatlng[0][2].lng}` : 
                // coorsType == 'polyline' ?
                // `${currentLatlng[0].lat},${currentLatlng[0].lng}, ${currentLatlng[currentLatlng.length-1].lat},${currentLatlng[currentLatlng.length-1].lng}` :
                `${currentLatlng.lat},${currentLatlng.lng}`,
                // if latlng is array, then check shapes otherwise get normal 1 coors [lat,lng] 
                coords = Array.isArray(currentLatlng) ? drawTypeCoors : `${currentLatlng.lat},${currentLatlng.lng}`,
                // if it's not circle, set a geom limit [not necessary]
                geom =  coorsType == 'circle' ? ``: ` geom(${coords})`;
    
        var url = `https://overpass-api.de/api/interpreter?data=${
          encodeURIComponent(`[out:json];(rel(${rad}${coords})${areaType};>;);out${geom};`)}`;
        var result = await fetch(url).then(resp => resp.json());
        
        if(result.hasOwnProperty("elements")){
            if(result.elements.length > 0) {
                for(let el of result.elements){
                    // let img = this.fetchLocationImageByName();
                    if(el.lat && el.lon){
                        let marker = new L.marker([el.lat, el.lon])
                            .bindPopup(
                                popUpTemplate ? popUpTemplate :
                                this.sidebarPanelTemplate(null, el.lat.toFixed(4)+' , '+ el.lon.toFixed(4))
                            ).addTo(this.map);

                            markers.push(marker);
                    } 
                }
            }
        }
        
        return markers;
};


// init fn
QiamMap.prototype.init = function() {
    // init new instance with dom selector
    var qiam = new QiamMap("mapid");
    // create the map
    qiam.createMap();
    // set actions on marker
    qiam.marker.on('dragend', qiam.onMarkerDrag.bind(qiam));
    qiam.marker.on('click', qiam.onMarkerClick.bind(qiam));

    // add draw toolbar
    qiam.drawBar = qiam.addDrawToolBar();
    // add side bar
    qiam.sidebar = qiam.addSideBar();
    // add attribution panel
    var pointDataPanel = qiam.addSidebarPanel(
        {
            id: 'data-panel', 
            icon: '<i class="fa fa-github"></i>', 
            content : '<strong class="h2 text-center d-flex justify-content-center my-5 text-primary border-bottom border-top text-capitalize">Ahmed Salah</strong>', 
            title: 'Attribution', 
            position: 'bottom'
        }
    );
    
    // add coor point info panel
    var pointInfoPanel = qiam.addSidebarPanel({});
    qiam.sidebar.disablePanel(pointInfoPanel.id); // now it has no content, disable on init


};

// init
QiamMap.prototype.init();