export declare const ssr = true;
export declare function getServerSideProps(): {
    props: {
        message: string;
    };
};
export default function notreSsrPage({ message }: {
    message: string;
}): import("react/jsx-runtime").JSX.Element;
