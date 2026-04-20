// js/data.js
const bookData = [
    {
        id: "cover",
        title: "The Book of JS",
        isCover: true,
        content: "A journey through the depths of modern web development. Scroll to open.",
        image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600&h=800"
    },
    {
        id: "page-1",
        title: "Introduction",
        content: "Welcome to the interactive physical book experience. The web is not just flat documents anymore—it's an interactive canvas where dimensions come alive. Built entirely with CSS 3D transforms.",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600"
    },
    {
        id: "page-2",
        title: "The Art of Scrolling",
        content: "Scroll velocity drives this experience. Using native scroll, we map your interaction to physical properties. A slow, methodical scroll folds the page delicately. A rapid flick turns it with force.",
        image: "https://images.unsplash.com/photo-1518655048521-f130df041f66?auto=format&fit=crop&q=80&w=600"
    },
    {
        id: "page-3",
        title: "Immersive Audio",
        content: "The Web Audio API listens to your scroll delta. When you scroll quickly, a rustling sound dynamically pitches up and increases in volume, mimicking the real acoustics of paper.",
        image: "https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&q=80&w=600"
    },
    {
        id: "page-4",
        title: "Dynamic Content",
        content: "Because this is rendered using full HTML DOM nodes swinging via rotateY, any text is fully selectable, interactive, and responsive. You could put a video or a mini-game on this page.",
        image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600"
    },
    {
        id: "back-cover",
        title: "The End",
        isCover: true,
        content: "Thank you for exploring this spatial computing prototype. Return to the start to play again.",
        image: ""
    }
];

export default bookData;
