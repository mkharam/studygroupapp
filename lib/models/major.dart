class Major {
  final String name;
  final List<Module> modules;

  Major({required this.name, required this.modules});

  factory Major.fromJson(Map<String, dynamic> json) {
    return Major(
      name: json['major'],
      modules: (json['modules'] as List).map((e) => Module.fromJson(e)).toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'major': name,
      'modules': modules.map((e) => e.toJson()).toList(),
    };
  }
}