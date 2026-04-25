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
    id: "cover",
    isCover: true,
    title: "Repo Parking",
    body: "Park and unpark git repos to save disk space. When you park a repository, it removes the local copy but saves everything to your private vault. Unpark to restore it on any machine.",
    route: "/",
  },
  {
    id: "intro",
    title: "What is repo-parking?",
    body: "repo-parking is a CLI tool that frees up disk space by archiving git repositories you aren't currently working on. Your code lives safely encrypted in a personal vault repository. When you need a project back, unpark it in seconds. It works entirely offline after initial setup — your vault is just a private GitHub or GitLab repo you control.",
    image: "/images/generated/page-intro.jpeg",
  },
  {
    id: "installation",
    title: "Installation",
    body: "Requires Node.js v18 or higher. Install globally with npm:\n\nnpm install -g repo-parking\n\nThe -g flag is required for global installation. Without it, the parking command won't be available globally. Compatible with macOS and Linux only.",
    image: "/images/generated/page-installation.png",
    route: "/install",
  },
  {
    id: "setup",
    title: "Initial Setup",
    body: "Before first use, create a private vault repository on GitHub or GitLab. Do NOT initialize it with a README. Then run:\n\nparking init\n\nYou'll provide your vault's SSH remote URL and choose a master password. Important: a recovery key will be shown once — store it safely in a password manager. It's your only path to recover if you forget your password.",
    image: "/images/generated/page-setup.jpeg",
    route: "/setup",
  },
  {
    id: "park-command",
    title: "parking park",
    body: "Park the current repository to free up disk space:\n\ncd my-project\nparking park my-app\n\nYou'll set a setup command (like npm install), any extra files to preserve beyond .env, and an optional SSH alias. Safety: parking checks all local branches for unpushed commits and blocks parking if any are found, preventing data loss.",
    image: "/images/generated/page-park.jpeg",
    route: "/park",
  },
  {
    id: "list-status",
    title: "List & Status",
    body: "Show all parked projects:\n\nparking list\n\nEach project gets a permanent letter (A, B, C...) that never changes or gets reused. View details with:\n\nparking status my-app\nparking status A\n\nLetters are permanent identifiers — once assigned, a project keeps its letter forever even after being forgotten.",
    image: "/images/generated/page-list.png",
    route: "/list",
  },
  {
    id: "unpark",
    title: "parking unpark",
    body: "Restore a parked project to your current directory:\n\nparking unpark my-app\nparking unpark A\n\nYou'll be asked to confirm the setup command before it runs. Your SSH configuration is respected on restore — parking looks for your key in ~/.ssh/config and falls back to stored paths if needed.",
    image: "/images/generated/page-unpark.jpeg",
    route: "/unpark",
  },
  {
    id: "security",
    title: "Security Architecture",
    body: "Your master password is never stored. It wraps a master encryption key (MEK) that encrypts all vault data. Encryption uses AES-256-GCM with PBKDF2 key derivation at 100,000 iterations. An HMAC-SHA256 verifier confirms your password without decrypting anything. The vault itself is a standard git repository — you own and control it completely.",
    image: "/images/generated/page-security.jpeg",
    route: "/security",
  },
  {
    id: "recovery",
    title: "Recovery & Passwords",
    body: "Change your master password anytime without re-encrypting vault data:\n\nparking change-password\n\nIf you forget your password, use the recovery key from init:\n\nparking recover\n\nEnter your recovery key in xxxx-xxxx-xxxx-xxxx-xxxx format to set a new password. Your parked projects and encrypted files remain intact. The encryption key (MEK) stays the same — only the password wrapper changes.",
    image: "/images/generated/page-recovery.png",
    route: "/recovery",
  },
  {
    id: "ssh-keys",
    title: "SSH Integration",
    body: "When parking, you can associate an SSH alias for your repo. On unpark, parking looks up the key in your ~/.ssh/config. If the alias can't be resolved, it falls back to the stored key path if that file exists. A 'Could not auto-load SSH key' warning is non-fatal — the clone proceeds and you may be prompted for your passphrase. Run ssh-add before unparking on new machines.",
    image: "/images/generated/page-ssh.jpeg",
    route: "/ssh",
  },
  {
    id: "technical",
    title: "Technical Details",
    body: "The vault is a standard git repository. Projects are stored as individual encrypted JSON files in vault/projects/. Meta information lives in vault/meta.json. Each file uses AES-256-GCM with a unique IV. The MEK is derived from your password using PBKDF2 (100,000 iterations, SHA-256). Recovery key wraps the MEK as an additional backup path. All sensitive data is encrypted before it leaves your machine.",
    image: "/images/generated/full_flow.png",
    route: "/technical",
  },
  {
    id: "back-cover",
    isCover: true,
    isBackCoverOutside: true,
    title: "Start Parking Today",
    body: "Free up gigabytes of disk space without losing access to your code. repo-parking keeps your projects safe in your own vault, encrypted and ready to restore on any machine. Park your repos. Free up your disk. Restore with confidence. Your code, encrypted, owned, and always accessible.",
  },
  {
    id: "form-page",
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
