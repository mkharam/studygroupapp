import 'package:flutter/material.dart';

final lightTheme = ThemeData(
  primarySwatch: Colors.purple,
  accentColor: Colors.deepPurpleAccent,
  brightness: Brightness.light,
  fontFamily: 'Roboto',
  pageTransitionsTheme: PageTransitionsTheme(
    builders: {
      for (var platform in TargetPlatform.values)
        platform: FadeUpwardsPageTransitionsBuilder(),
    },
  ),
  inputDecorationTheme: InputDecorationTheme(
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
    ),
    focusedBorder: OutlineInputBorder(
      borderSide: BorderSide(color: Colors.purple),
      borderRadius: BorderRadius.circular(12),
    ),
  ),
  dropdownMenuTheme: DropdownMenuThemeData(
    elevation: 4,
    menuStyle: MenuStyle(
      backgroundColor: MaterialStateProperty.all(Colors.purple.shade50),
    ),
  ),
);

final darkTheme = lightTheme.copyWith(brightness: Brightness.dark);