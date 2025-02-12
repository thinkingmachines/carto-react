import React, { useEffect, useRef } from 'react';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { debounce } from '@carto/react-core';

/**
 * React component for working with Google Maps API and deck.gl
 *
 * @param { Object } props - Properties
 * @param { Object } props.basemap - basemap
 * @param { Object } props.basemap.options - *MapOptions* as defined by https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions
 * @param { Object } props.viewState - Viewstate, as defined by deck.gl. Just center and zoom level are supported
 * @param { Layer[] } props.layers - deck.gl layers array
 * @param { function } props.getTooltip - (Optional). Tooltip handler
 * @param { function } props.onResize - (Optional) onResize handler
 * @param { function } props.onViewStateChange - (Optional) onViewStateChange handler
 * @param { string } props.apiKey - Google Maps API Key
 * @returns { Object } - Data returned from the SQL query execution
 */
export function GoogleMap(props) {
  debugger;
  console.log(props);
  const {
    basemap,
    viewState,
    layers,
    getTooltip,
    onResize,
    onViewStateChange,
    apiKey
  } = props;
  // based on https://publiuslogic.com/blog/google-maps+react-hooks/
  const containerRef = useRef();
  const triggerResize = (map) => {
    window.google.maps.event.trigger(map, 'resize');
  };

  const customStyle = props.style || {};

  let containerStyle = {
    position: 'absolute',
    zIndex: 0,
    left: 0,
    top: 0,
    width: props.width || '100%',
    height: props.height || '100%',
    ...customStyle
  };

  const onLoad = () => {
    // gmaps
    let options = {
      center: {
        lat: viewState.latitude,
        lng: viewState.longitude
      },
      mapTypeControl: false,
      zoom: viewState.zoom + 1, // notice the 1 zoom level difference relative to deckgl
      fullscreenControl: false,
      zoomControl: false,
      streetViewControl: false,
      ...basemap.options
    };

    const mapNotConnected = containerRef.current.children.length === 0;
    if (!window.cartoGmap || mapNotConnected) {
      const map = new window.google.maps.Map(containerRef.current, options);
      const deckOverlay = new GoogleMapsOverlay({ layers, getTooltip });

      const handleViewportChange = () => {
        const center = map.getCenter();
        // adapted to common Deck viewState format
        const viewState = {
          longitude: center.lng(),
          latitude: center.lat(),
          zoom: Math.max(map.getZoom() - 1, 1), // cap min zoom level to 1
          pitch: 0, // no pitch or bearing gmaps yet
          bearing: 0
        };

        if (JSON.stringify(window.cartoViewState) !== JSON.stringify(viewState)) {
          window.cartoViewState = viewState;
          onViewStateChange && props.onViewStateChange({ viewState });
        }
      };

      const handleViewportChangeDebounced = debounce(handleViewportChange, 200);
      map.addListener('bounds_changed', handleViewportChangeDebounced);
      map.addListener('resize', () => {
        onResize &&
          onResize({
            height: map.getDiv().offsetHeight,
            width: map.getDiv().offsetWidth
          });
      });

      window.onresize = () => {
        triggerResize(map);
      };

      triggerResize(map);

      window.cartoGmap = map;
      window.cartoDeck = deckOverlay;
    } else {
      const { center, zoom, ...rest } = options;
      window.cartoGmap.setZoom(zoom);
      window.cartoGmap.setCenter(center);
      window.cartoGmap.setOptions(rest);
      window.cartoDeck.setProps({ layers, getTooltip });
    }

    window.cartoDeck.setMap(window.cartoGmap);
  };

  useEffect(() => {
    if (!document.querySelector('#gmaps')) {
      const script = document.createElement(`script`);
      script.id = 'gmaps';
      script.async = true;
      script.type = `text/javascript`;
      script.src = `https://maps.google.com/maps/api/js?key=` + apiKey;
      const headScript = document.getElementsByTagName(`script`)[0];
      headScript.parentNode.insertBefore(script, headScript);
      script.addEventListener(`load`, onLoad);
    } else if (document.querySelector('#gmaps') && window.google) {
      onLoad();
    }
  });

  return <div ref={containerRef} style={containerStyle}></div>;
}
