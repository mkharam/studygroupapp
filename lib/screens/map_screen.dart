import 'package:flutter/material.dart';
import 'package:mapbox_gl/mapbox_gl.dart';

class MapScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Map')),
      body: MapboxMap(
        accessToken: 'pk.eyJ1IjoibWtoYXJhbSIsImEiOiJjbTcweTV5cmowNm1yMmtwY3ZtOHVuaW5vIn0.dlQ7hyO9lvUsVtX4eJ2Q-g',
        initialCameraPosition: CameraPosition(
          target: LatLng(51.242, -0.587),
          zoom: 14,
        ),
        onMapCreated: (controller) {},
        onStyleLoadedCallback: () {},
      ),
    );
  }
}