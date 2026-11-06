plugins {
    id("com.android.application") apply false
    id("org.jetbrains.kotlin.android") apply false
    id("dev.flutter.flutter-gradle-plugin") apply false
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val rootProjectDir = rootProject.projectDir
val evaluationDependsOn: String by extra
rootProject.evaluationDependsOn(":app")

task<Delete>("clean") {
    delete(rootProject.buildFile)
}