export default function Loader() {
    return (
        <div className='h-full w-full flex items-center justify-center relative'>
            <img src='./logo.svg' className='absolute w-40  -translate-y-2 animate-ping' />
            <img src='./logo.svg' className='absolute w-40 blur-2xl animate-ping' />
            <img src='./logo.svg' className='absolute w-40' />
        </div>
    )
}
