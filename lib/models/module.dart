class Module {
  final String code;
  final String title;
  final String description;

  Module({required this.code, required this.title, this.description = ''});

  factory Module.fromJson(Map<String, dynamic> json) {
    return Module(
      code: json['code'],
      title: json['title'],
      description: json['description'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'code': code,
      'title': title,
      'description': description,
    };
  }
}