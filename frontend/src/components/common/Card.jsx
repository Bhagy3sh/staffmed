export default function Card({ color, children }){
    return (
        <div className="mx-4 my-3 p-4" style={{ backgroundColor: color }}>
            {children}
        </div>
    );

}