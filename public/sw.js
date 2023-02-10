self.addEventListener("install", event => {
    console.log("Service worker installed");
 });
 self.addEventListener("activate", event => {
    console.log("Service worker activated");
 });
 self.addEventListener('fetch', function (event) {
    // it can be empty if you just want to get rid of that error
});