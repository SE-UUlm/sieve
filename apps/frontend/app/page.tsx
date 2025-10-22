"use client";

import styled from "styled-components";
import Time from "../components/Time";

const Container = styled.div`
    height: 100%;
    width: 100%;
    overflow: hidden;
`;

const H1 = styled.h1`
    color: cyan;
    font-size: 50px;
    line-height: 100vh;
    text-align: center;
    transform: scale(calc(1vw / 10px), calc(1vh / 1px));
`;

export default function Home() {
    return (
        <Container>
            <H1>SIEVE</H1>
            <Time />
        </Container>
    );
}
