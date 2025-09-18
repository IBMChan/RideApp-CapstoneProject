document.addEventListener("DOMContentLoaded", () => {
  fetch('sidebar.html')
    .then(response => response.text())
    .then(data => {
      const sidebar = document.querySelector('.sidebar');
      if(sidebar){
        sidebar.innerHTML = data;
      }
    })
    .catch(err => {
      console.error('Failed to load sidebar:', err);
    });
});
