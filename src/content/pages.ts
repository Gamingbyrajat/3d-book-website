export type Page = {
  id: string;
  title?: string;
  body?: string;
  image?: string;
  isCover?: boolean;
  isBackCoverOutside?: boolean;
  isFormPage?: boolean;
  route?: string;
};

export const pages: Page[] = [
  {
    id: 'cover',
    isCover: true,
    title: 'HEADING TEXT',
    body: 'A journey through interactive design. Scroll to begin.',
    route: '/',
  },
  {
    id: 'page-1',
    title: 'Welcome',
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
    image: '/images/generated/page-welcome.svg',
  },
  {
    id: 'page-2',
    title: 'The Experience',
    body: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.',
    image: '/images/page-1.jpeg',
    route: '/nav1',
  },
  {
    id: 'page-3',
    title: 'Interactive Design',
    body: 'Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur.',
    image: '/images/page-2.jpeg',
  },
  {
    id: 'page-4',
    title: 'Visual Craft',
    body: 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.',
    image: '/images/page-3.jpeg',
    route: '/nav2',
  },
  {
    id: 'page-5',
    title: 'Motion & Flow',
    body: 'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit. Sed ut perspiciatis unde omnis iste natus error.',
    image: '/images/page-4.jpeg',
  },
  {
    id: 'page-6',
    title: 'Typography',
    body: 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores.',
    image: '/images/generated/page-typography.svg',
    route: '/nav3',
  },
  {
    id: 'page-7',
    title: 'Color Theory',
    body: 'Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.',
    image: '/images/generated/page-color-theory.svg',
  },
  {
    id: 'page-8',
    title: 'Spatial Design',
    body: 'Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.',
    image: '/images/generated/page-spatial-design.svg',
  },
  {
    id: 'page-9',
    title: 'The Details',
    body: 'Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus.',
    image: '/images/generated/page-details.svg',
    route: '/about',
  },
  {
    id: 'back-cover-inside',
    title: 'Thank You',
    body: 'We hope you enjoyed this journey through design and craft.',
  },
  {
    id: 'back-cover',
    isCover: true,
    isBackCoverOutside: true,
    title: 'HEADING TEXT',
    body: 'An exploration of design, typography, and the art of visual storytelling. Crafted with care for those who appreciate the details.',
  },
  {
    id: 'form-page',
    isFormPage: true,
  },
];

export const numSpreads = Math.ceil(pages.length / 2);

export const routeToSpread: Record<string, number> = {};
pages.forEach((page, idx) => {
  if (page.route) {
    routeToSpread[page.route] = Math.floor(idx / 2);
  }
});
