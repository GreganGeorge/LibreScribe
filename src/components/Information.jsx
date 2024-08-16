import React, { useState,useEffect,useRef } from 'react'
import Transcription from './Transcription';
import Translation from './Translation';

export default function Information(props) {
    const {output}=props;
    const [tab,setTab]=useState('transcription');
    const [translation,setTranslation]=useState(null)
    const [translating,setTranslating]=useState(null)
    const [toLanguage,setToLanguage]=useState('Select language')
    const worker=useRef();
    useEffect(() => {
        if (!worker.current) {
            worker.current = new Worker(new URL('../utils/translate.worker.js', import.meta.url), {
                type: 'module'
            });
        }

        const onMessageReceived = (e) => {
            switch (e.data.status) {
                case 'initiate':
                    console.log('Downloading model...');
                    break;
                case 'progress':
                    console.log('Loading...');
                    break;
                case 'complete':
                    console.log('Translation complete:',e.data.output[0].translation_text);
                    setTranslation(e.data.output[0].translation_text);
                    setTranslating(false);
                    break;
                case 'error':
                    console.error('Translation error:', e.data.error);
                    setTranslating(false);
                    break;
                default:
                    console.warn('Unknown status received:', e.data.status);
            }
        };

        worker.current.addEventListener('message', onMessageReceived);

        return () => {
            worker.current.removeEventListener('message', onMessageReceived);
        };
    });
    const textElement=tab==='transcription'?output.map(val=>val.text):translation ||''

    function handleCopy(){
        navigator.clipboard.writeText(textElement);
    }

    function handleDownload(){
        const element=document.createElement('a');
        const file=new Blob([textElement],{type:'text/plain'})
        element.href=URL.createObjectURL(file)
        element.download=`Librescribe_${new Date().toString()}.txt`
        document.body.appendChild(element)
        element.click()
    }

    function generateTranslation(){
        if(translating || toLanguage==='Select language'){
            return
        }
        setTranslating(true)
        worker.current.postMessage({
            text: output.map(val=>val.text),
            src_lang:'eng_Latn',
            tgt_lang:toLanguage
        })
    }

  return (
    <main className='flex-1 p-4 flex flex-col gap-3 text-center sm:gap-4 justify-center pb-20 
        max-w-prose w-full mx-auto'>
        <h1 className='font-semibold text-4xl sm:text-5xl md:text-6xl whitespace-nowrap'>
        Your <span className='text-blue-400 bold'>Transcription</span>
        </h1>
        <div className='grid grid-cols-2 mx-auto bg-white shadow rounded-full overflow-hidden items-center'>
            <button className={`px-4 duration-200 py-1 ${tab==='transcription'?'bg-blue-300 text-white':
                'text-blue-400 hover:text-blue-600'}`} onClick={()=>setTab('transcription')}>Transcription</button>
            <button className={`px-4 duration-200 py-1 ${tab==='translation'?'bg-blue-300 text-white':
                'text-blue-400 hover:text-blue-600'}`} onClick={()=>setTab('translation')}>Translation</button>
        </div>
        <div className='my-8 flex flex-col'>
            {tab==='transcription'?(<Transcription {...props} textElement={textElement}/>):(<Translation 
            {...props} toLanguage={toLanguage} translating={translating} textElement={textElement} 
            setToLanguage={setToLanguage} generateTranslation={generateTranslation}/>)}
        </div>
        <div className='flex items-center gap-4 mx-auto'>
            <button onClick={handleCopy} title="Copy" className='bg-white text-blue-300 px-2 aspect-square 
            hover:text-blue-500 duration-200 grid place-items-center rounded'>
                <i className='fa-solid fa-copy'></i>
            </button>
            <button onClick={handleDownload} title="Download" className='bg-white text-blue-300 px-2 aspect-square 
            hover:text-blue-500 duration-200 grid place-items-center rounded'>
                <i className='fa-solid fa-download'></i>
            </button>
        </div>
    </main>
  )
}
