// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// pub mod native;

use tauri::Manager;
use tauri::{
    AppHandle, CustomMenuItem, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
    Window,
};

fn main() {
    let open_main = CustomMenuItem::new("open_main".to_string(), "打开主界面");
    let about = CustomMenuItem::new("about".to_string(), "About ...");
    let quit = CustomMenuItem::new("quit".to_string(), "Exit");
    let spotlight = CustomMenuItem::new("spotlight".to_string(), "System Information");
    let tray_menu = SystemTrayMenu::new()
        .add_item(open_main)
        .add_item(about)
        // .add_item(q_clipboard)
        .add_item(spotlight)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);
    // insert the menu items here
    tauri::Builder::default()
        .setup(|app| {
            let splashscreen_window = app.get_window("splashscreen").unwrap();
            let main_window = app.get_window("main").unwrap();
            // we perform the initialization code on a new task so the app doesn't freeze
            tauri::async_runtime::spawn(async move {
                // initialize your app here instead of sleeping :)
                println!("Initializing...");
                std::thread::sleep(std::time::Duration::from_secs(2));
                println!("Done initializing.");

                // After it's done, close the splashscreen and display the main window
                splashscreen_window.close().unwrap();
                main_window.show().unwrap();
            });
            Ok(())
        })
        .system_tray(SystemTray::new().with_menu(tray_menu))
        .on_system_tray_event(system_tray_handler)
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
fn system_tray_handler(app: &AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::MenuItemClick { id, .. } => {
            // get a handle to the clicked menu item
            // note that `tray_handle` can be called anywhere,
            // just get an `AppHandle` instance with `app.handle()` on the setup hook
            // and move it to another function or thread
            let item_handle = app.tray_handle().get_item(&id);
            match id.as_str() {
                // 退出
                "spotlight" => {
                    create_spotlight_window(app);
                    let main_window = app.get_window("main").unwrap();
                    main_window.hide().unwrap();
                    item_handle.set_title("退出Spotlight模式").unwrap();
                    // sl_state.0.fetch_or(true, Ordering::Relaxed);
                }
                // 退出
                "quit" => {
                    // TODO: do something before exsits
                    std::process::exit(0);
                }
                "open_main" => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }

                "about" => {}
                _ => {}
            }
        }
        _ => {}
    }
}

/**
 * 创建spotlight窗口
 */
fn create_spotlight_window(app: &AppHandle) -> Window {
    let spotlight_window = tauri::WindowBuilder::new(
        app,
        "spotlight", /* the unique window label */
        tauri::WindowUrl::App("spotlight.html".parse().unwrap()),
    )
    // .transparent(true)
    .decorations(false)
    .resizable(false)
    .visible(true)
    .build()
    .expect("failed to build window");
    // spotlight_window
    //     .set_size(LogicalSize::new(800, 60))
    //     .expect("failed to set size");
    // native_windows(&spotlight_window, Some(10.), false);
    return spotlight_window;
}

fn close_splash_window(app: &AppHandle) {
    let splashscreen_window = app.get_window("splashscreen").unwrap();
    let main_window = app.get_window("main").unwrap();
    // we perform the initialization code on a new task so the app doesn't freeze
    tauri::async_runtime::spawn(async move {
        // initialize your app here instead of sleeping :)
        println!("Initializing...");
        std::thread::sleep(std::time::Duration::from_secs(2));
        println!("Done initializing.");

        // After it's done, close the splashscreen and display the main window
        splashscreen_window.close().unwrap();
        main_window.show().unwrap();
    });
    // Ok(());
}
