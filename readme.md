<script>
window.addEventListener('blur', function() {
    var focusedElement = document.activeElement;

    parseHTML(focusedElement);
});

function parseHTML(element) {
    console.log(element.tagName);
}
</script>