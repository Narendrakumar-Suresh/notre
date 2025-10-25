export const metadata = ({ params }: { params: { slug: string } }) => ({
  title: `${params.slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} - Blog`,
  description: `Read about ${params.slug.replace(/-/g, ' ')}`,
  openGraph: { type: 'article' }
});

export default function BlogPost({ params }: { params: { slug: string } }) {
  return (
    <div className="bg-black h-screen">
      <h1 className="bg-red-700 w-fit text-4xl font-mono">
        Blog Post: <span className="text-gray-300">{params.slug}</span>
      </h1>
    </div>
  );
}
